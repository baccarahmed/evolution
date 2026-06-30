import os
import requests
import logging

# Configuration logging
logger = logging.getLogger(__name__)

FLOUCI_APP_TOKEN = os.getenv("FLOUCI_APP_TOKEN")
FLOUCI_APP_SECRET = os.getenv("FLOUCI_APP_SECRET")

def create_payment(amount, success_url, fail_url):
    """
    Crée un paiement Flouci.
    - amount: en millimes (1 TND = 1000)
    """
    url = "https://developers.flouci.com/api/generate_payment"
    payload = {
        "app_token": FLOUCI_APP_TOKEN,
        "app_secret": FLOUCI_APP_SECRET,
        "amount": int(amount),
        "accept_card": "true",
        "session_timeout_secs": 1200,
        "success_link": success_url,
        "fail_link": fail_url,
        "developer_tracking_id": "trademaster"
    }
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            return {
                "payment_id": data["result"]["payment_id"],
                "payment_url": f"https://app.flouci.com/payment/{data['result']['payment_id']}"
            }
        else:
            error_msg = data.get("message", "Erreur Flouci inconnue")
            logger.error(f"Flouci Create Payment Error: {error_msg}")
            raise Exception(error_msg)
            
    except Exception as e:
        logger.error(f"Flouci API Exception: {str(e)}")
        raise e

def verify_payment(payment_id):
    """
    Vérifie le statut d'un paiement Flouci.
    """
    url = f"https://developers.flouci.com/api/verify_payment/{payment_id}"
    headers = {
        "apppublic": FLOUCI_APP_TOKEN,
        "appsecret": FLOUCI_APP_SECRET
    }
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            return data["result"]["status"] == "SUCCESS"
        
        return False
        
    except Exception as e:
        logger.error(f"Flouci Verify Payment Exception: {str(e)}")
        return False
