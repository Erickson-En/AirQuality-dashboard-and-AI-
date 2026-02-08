# ml/anomaly/config.py
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env if present

class Config:
    # Mongo
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB = os.getenv("MONGO_DB", "airquality")
    MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "readings")
    ALERTS_COLLECTION = os.getenv("ALERTS_COLLECTION", "alerts")

    # Backend API (optional): POST alerts here
    BACKEND_ALERT_URL = os.getenv("BACKEND_ALERT_URL", "").strip()

    # Email (SMTP)
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO")
    ALERT_EMAIL_FROM = os.getenv("ALERT_EMAIL_FROM", SMTP_USER)

    # Twilio
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_FROM_PHONE = os.getenv("TWILIO_FROM_PHONE")
    ALERT_SMS_TO = os.getenv("ALERT_SMS_TO")
    USE_TWILIO = os.getenv("USE_TWILIO", "false").lower() in ("1", "true", "yes")

    # Detector params
    POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", 10))
    ROLLING_WINDOW_MINUTES = int(os.getenv("ROLLING_WINDOW_MINUTES", 15))
    MIN_SAMPLES_FOR_MODEL = int(os.getenv("MIN_SAMPLES_FOR_MODEL", 50))
    ANOMALY_THRESHOLD = float(os.getenv("ANOMALY_THRESHOLD", -0.2))  # IsolationForest score threshold
