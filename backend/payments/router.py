import os
import logging
import re
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from . import flouci, binance
import database, models, auth, schemas
import email_service
from auth import get_current_user

# Configuration logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment", tags=["Payments"])

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000") # Align with main app port
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaymentCreateRequest(BaseModel):
    plan: str
    gateway: str

def is_valid_trc20(address: str) -> bool:
    """Basic regex check for TRC20 address format"""
    return bool(re.match(r'^T[1-9A-HJ-NP-Za-km-z]{33}$', address))

@router.post("/create")
async def create_payment(
    request: PaymentCreateRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plan_slug = request.plan.lower()
    gateway = request.gateway.lower()
    
    # Récupérer le plan depuis la base de données
    db_plan = db.query(models.PricingPlan).filter(
        models.PricingPlan.slug == plan_slug,
        models.PricingPlan.is_active == True
    ).first()

    if not db_plan:
        raise HTTPException(status_code=400, detail="Plan invalide ou inactif")
        
    success_url = f"{BASE_URL}/api/payment/success?gateway={gateway}&plan={plan_slug}"
    fail_url = f"{BASE_URL}/api/payment/failed?gateway={gateway}"
    
    try:
        if gateway == "flouci":
            amount = db_plan.price_tnd
            currency = "TND"
            result = flouci.create_payment(amount, success_url, fail_url)
            payment_id = result["payment_id"]
            payment_url = result["payment_url"]
            
            # Créer un enregistrement de commande de paiement
            db_order = models.PaymentOrder(
                user_id=current_user.id,
                amount=amount,
                currency=currency,
                status="pending",
                payment_method=gateway,
                gateway_order_id=payment_id
            )
            db.add(db_order)
            db.commit()

            return {
                "payment_url": payment_url,
                "payment_id": payment_id,
                "gateway": gateway
            }
            
        elif gateway == "binance":
            amount = db_plan.price_usd
            currency = "USDT"
            wallet_address = os.getenv("BINANCE_WALLET_ADDRESS")
            
            if not wallet_address or wallet_address == "your_binance_api_key" or "YOUR_USDT" in wallet_address:
                logger.error("Binance Wallet Address not configured in .env")
                raise HTTPException(status_code=500, detail="Le système de paiement est en maintenance (Adresse non configurée)")

            if not is_valid_trc20(wallet_address):
                logger.error(f"Invalid TRC20 address in .env: {wallet_address}")
                raise HTTPException(status_code=500, detail="Erreur de configuration de sécurité (Adresse invalide)")
            
            # Créer un enregistrement de commande de paiement en attente
            order_id = f"TM-{plan_slug.upper()}-{uuid4().hex[:8].upper()}"
            db_order = models.PaymentOrder(
                user_id=current_user.id,
                amount=amount,
                currency=currency,
                status="pending",
                payment_method="binance_manual",
                gateway_order_id=order_id
            )
            db.add(db_order)
            db.commit()

            return {
                "payment_url": None,
                "payment_id": order_id,
                "gateway": "binance",
                "wallet_address": wallet_address,
                "amount": amount,
                "network": "TRC20 (Tron)",
                "security_verified": True
            }
        else:
            raise HTTPException(status_code=400, detail="Passerelle invalide")
            
    except Exception as e:
        logger.error(f"Payment Creation Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/success")
async def payment_success(
    gateway: str, 
    plan: str,
    payment_id: Optional[str] = Query(None, alias="payment_id"),
    db: Session = Depends(get_db)
):
    # Note: For Flouci, payment_id is passed in query string by default
    # For Binance, we check prepayId
    
    verified = False
    
    try:
        if gateway == "flouci" and payment_id:
            verified = flouci.verify_payment(payment_id)
        elif gateway == "binance" and payment_id:
            verified = binance.verify_payment(payment_id)
            
        if verified:
            # Mettre à jour la base de données
            db_order = db.query(models.PaymentOrder).filter(
                models.PaymentOrder.gateway_order_id == payment_id
            ).first()

            if db_order and db_order.status != "completed":
                db_order.status = "completed"
                
                # Récupérer le plan pour la durée
                db_plan = db.query(models.PricingPlan).filter(models.PricingPlan.slug == plan).first()
                duration_months = db_plan.duration_months if db_plan else 1
                
                # Créer ou mettre à jour l'abonnement
                start_date = database.datetime.now()
                end_date = start_date + database.timedelta(days=30 * duration_months)
                
                db_sub = models.Subscription(
                    user_id=db_order.user_id,
                    package_name=db_plan.name if db_plan else plan.upper(),
                    start_date=start_date,
                    end_date=end_date,
                    is_active=True,
                    payment_status="paid"
                )
                db.add(db_sub)
                
                # Mettre à jour le rôle de l'utilisateur
                user = db.query(models.User).filter(models.User.id == db_order.user_id).first()
                if user and user.role == "standard":
                    user.role = "subscriber"
                
                # Notification & Email
                if user:
                    notification = models.Notification(
                        user_id=user.id,
                        title="Paiement Reçu !",
                        message=f"Votre abonnement au plan {db_plan.name if db_plan else plan.upper()} est maintenant actif.",
                        type="success"
                    )
                    db.add(notification)
                    # Use a task or await directly for now
                    import asyncio
                    asyncio.create_task(email_service.send_payment_success_email(user.email, db_plan.name if db_plan else plan.upper()))

                db.commit()

            return RedirectResponse(
                url=f"{FRONTEND_URL}/dashboard?payment=success&gateway={gateway}&plan={plan}"
            )
        
        return RedirectResponse(
            url=f"{FRONTEND_URL}/dashboard?payment=cancel&gateway={gateway}&reason=unverified"
        )
            
    except Exception as e:
        logger.error(f"Payment Verification Failed: {str(e)}")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/dashboard?payment=cancel&gateway={gateway}&reason=verification_error"
        )


@router.get("/failed")
async def payment_failed(gateway: str):
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?payment=cancel&gateway={gateway}")
