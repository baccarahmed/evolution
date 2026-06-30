import os
import time
import hmac
import hashlib
import json
import requests
import logging
from uuid import uuid4

# Configuration logging
logger = logging.getLogger(__name__)

BINANCE_PAY_API_KEY = os.getenv("BINANCE_PAY_API_KEY")
BINANCE_PAY_SECRET_KEY = os.getenv("BINANCE_PAY_SECRET_KEY")
BINANCE_BASE_URL = "https://bpay.binanceapi.com"

def _generate_signature(payload_str, timestamp, nonce):
    """
    Génère la signature HMAC-SHA512 requise par Binance Pay.
    """
    payload_to_sign = f"{timestamp}\n{nonce}\n{payload_str}\n"
    signature = hmac.new(
        BINANCE_PAY_SECRET_KEY.encode("utf-8"),
        payload_to_sign.encode("utf-8"),
        hashlib.sha512
    ).hexdigest().upper()
    return signature

def create_payment(amount_usd, order_id, success_url, fail_url):
    """
    Crée une commande Binance Pay.
    """
    endpoint = "/binancepay/openapi/v2/order"
    url = f"{BINANCE_BASE_URL}{endpoint}"
    
    timestamp = int(time.time() * 1000)
    nonce = uuid4().hex[:32]
    
    payload = {
        "env": { "terminalType": "WEB" },
        "merchantTradeNo": order_id,
        "orderAmount": float(amount_usd),
        "currency": "USDT",
        "goods": {
            "goodsType": "02",
            "goodsCategory": "Z000",
            "referenceGoodsId": order_id,
            "goodsName": "TradeMaster Plan",
            "goodsDetail": "Subscription"
        },
        "returnUrl": success_url,
        "cancelUrl": fail_url
    }
    
    payload_str = json.dumps(payload)
    signature = _generate_signature(payload_str, timestamp, nonce)
    
    headers = {
        "Content-Type": "application/json",
        "BinancePay-Timestamp": str(timestamp),
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": BINANCE_PAY_API_KEY,
        "BinancePay-Signature": signature
    }
    
    try:
        response = requests.post(url, headers=headers, data=payload_str)
        data = response.json()
        
        if response.status_code == 200 and data.get("status") == "SUCCESS":
            return {
                "payment_id": data["data"]["prepayId"],
                "payment_url": data["data"]["checkoutUrl"]
            }
        else:
            error_msg = data.get("errorMessage", "Erreur Binance inconnue")
            logger.error(f"Binance Create Order Error: {error_msg}")
            raise Exception(error_msg)
            
    except Exception as e:
        logger.error(f"Binance API Exception: {str(e)}")
        raise e

def verify_payment(prepay_id):
    """
    Vérifie le statut d'une commande Binance Pay.
    """
    endpoint = "/binancepay/openapi/v2/order/query"
    url = f"{BINANCE_BASE_URL}{endpoint}"
    
    timestamp = int(time.time() * 1000)
    nonce = uuid4().hex[:32]
    
    payload = { "prepayId": prepay_id }
    payload_str = json.dumps(payload)
    signature = _generate_signature(payload_str, timestamp, nonce)
    
    headers = {
        "Content-Type": "application/json",
        "BinancePay-Timestamp": str(timestamp),
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": BINANCE_PAY_API_KEY,
        "BinancePay-Signature": signature
    }
    
    try:
        response = requests.post(url, headers=headers, data=payload_str)
        data = response.json()
        
        if response.status_code == 200 and data.get("status") == "SUCCESS":
            return data["data"]["status"] == "PAID"
        
        return False
        
    except Exception as e:
        logger.error(f"Binance Verify Payment Exception: {str(e)}")
        return False
