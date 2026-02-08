# ml/anomaly/alert_sender.py
import smtplib
from email.message import EmailMessage
from twilio.rest import Client as TwilioClient
import requests
from config import Config

def send_email(subject: str, body: str):
    if not Config.SMTP_HOST or not Config.SMTP_USER or not Config.SMTP_PASSWORD:
        print("SMTP not configured; skipping email.")
        return False
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = Config.ALERT_EMAIL_FROM
    msg['To'] = Config.ALERT_EMAIL_TO
    msg.set_content(body)

    try:
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as s:
            s.starttls()
            s.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
            s.send_message(msg)
        print("Email sent to", Config.ALERT_EMAIL_TO)
        return True
    except Exception as e:
        print("Failed to send email:", e)
        return False

def send_sms(body: str):
    if not Config.USE_TWILIO:
        print("Twilio disabled; skipping SMS.")
        return False
    if not Config.TWILIO_ACCOUNT_SID or not Config.TWILIO_AUTH_TOKEN or not Config.TWILIO_FROM_PHONE:
        print("Twilio not configured; skipping SMS.")
        return False
    try:
        client = TwilioClient(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=Config.TWILIO_FROM_PHONE,
            to=Config.ALERT_SMS_TO
        )
        print("SMS sent:", message.sid)
        return True
    except Exception as e:
        print("Failed to send SMS:", e)
        return False

def post_alert_to_backend(alert_payload: dict):
    url = Config.BACKEND_ALERT_URL
    if not url:
        return False
    try:
        resp = requests.post(url, json=alert_payload, timeout=5)
        print("Posted alert to backend, status:", resp.status_code)
        return True
    except Exception as e:
        print("Failed to post alert to backend:", e)
        return False

# Optionally call run_once after anomaly alerts to refresh analytics (lazy import to avoid circulars)
def process_and_alert(anomalies):
    for anomaly in anomalies:
        # ...existing code...
        post_alert_to_backend(anomaly)
    # After anomalies, refresh analytics snapshot
    try:
        from analytics.pipeline import run_once as refresh_analytics
        refresh_analytics()
    except Exception as e:
        print("Analytics refresh failed:", e)
