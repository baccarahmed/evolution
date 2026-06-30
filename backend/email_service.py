import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM", SMTP_USERNAME)

async def send_email(to_email: str, subject: str, body: str, is_html: bool = False):
    """
    Sends an email using SMTP (Gmail default).
    Note: For Gmail, you need an 'App Password'.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("SMTP credentials not configured. Skipping email.")
        return False

    msg = MIMEMultipart()
    msg['From'] = MAIL_FROM
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html' if is_html else 'plain'))

    try:
        # Using context manager for automatic cleanup
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

async def send_welcome_email(user_email: str, user_name: str):
    subject = "Bienvenue sur Evolution Academy !"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Bienvenue {user_name} !</h2>
                <p>Nous sommes ravis de vous compter parmi nos membres.</p>
                <p>Evolution Academy est votre partenaire pour maîtriser les marchés financiers.</p>
                <p>Commencez dès maintenant en explorant nos formations :</p>
                <a href="http://localhost:3000/formations" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Voir les formations</a>
                <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
            </div>
        </body>
    </html>
    """
    return await send_email(user_email, subject, body, is_html=True)

async def send_payment_success_email(user_email: str, plan_name: str):
    subject = "Paiement Confirmé - Votre abonnement est actif !"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #10b981;">Félicitations !</h2>
                <p>Votre paiement pour le plan <strong>{plan_name}</strong> a été confirmé avec succès.</p>
                <p>Votre compte a été mis à jour et vous avez maintenant accès à tout le contenu exclusif.</p>
                <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">Accéder à mon Dashboard</a>
                <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Merci de votre confiance.</p>
            </div>
        </body>
    </html>
    """
    return await send_email(user_email, subject, body, is_html=True)
