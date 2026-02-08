# ml/anomaly/detector.py
import time
import traceback
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from pymongo import MongoClient
from .config import Config
from .utils import flatten_reading
from .alert_sender import send_email, send_sms, post_alert_to_backend
from typing import List, Dict
from statistics import mean, pstdev

# Connect to MongoDB
client = MongoClient(Config.MONGO_URI)
db = client[Config.MONGO_DB]
readings_col = db[Config.MONGO_COLLECTION]
alerts_col = db[Config.ALERTS_COLLECTION]

def fetch_recent_readings(minutes):
    """
    Return list of flattened readings for the last `minutes`.
    """
    since = datetime.utcnow() - timedelta(minutes=minutes)
    cursor = readings_col.find({"timestamp": {"$gte": since}}).sort("timestamp", 1)
    rows = [flatten_reading(doc) for doc in cursor]
    return rows

def build_dataframe(rows, metric_keys):
    if not rows:
        return pd.DataFrame(columns=['timestamp'] + metric_keys)
    df = pd.DataFrame(rows)
    # ensure metric columns exist
    for k in metric_keys:
        if k not in df.columns:
            df[k] = np.nan
    df = df[['timestamp'] + metric_keys]
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.set_index('timestamp').sort_index()
    # forward-fill/backfill small gaps
    df = df.astype(float).interpolate(limit_direction='both')
    return df

def detect_with_isolationforest(df, metric_keys):
    """
    Fit IsolationForest on the rolling samples (multivariate) and score the latest sample.
    Returns anomaly_score (the lower the more anomalous) and is_anomaly bool.
    """
    X = df[metric_keys].dropna()
    if len(X) < Config.MIN_SAMPLES_FOR_MODEL:
        return None, False  # not enough samples
    # fit model on historical window (exclude the last sample for scoring? we'll include)
    iso = IsolationForest(n_estimators=200, contamination='auto', random_state=42)
    iso.fit(X)
    # decision_function: larger -> more normal. We use score_samples -> higher = less anomalous
    scores = iso.decision_function(X)  # higher is more normal
    latest_score = scores[-1]
    # interpret: if latest_score < threshold -> anomaly
    is_anom = latest_score < Config.ANOMALY_THRESHOLD
    return float(latest_score), bool(is_anom)

def detect_with_zscore(df, metric_key, z_thresh=3.0):
    """
    Univariate fallback: compute z-score of the last value vs mean/std; return bool.
    """
    series = df[metric_key].dropna()
    if len(series) < 6:
        return False
    mean = series.mean()
    std = series.std()
    if std == 0 or np.isnan(std):
        return False
    last = series.iloc[-1]
    z = abs((last - mean) / std)
    return z >= z_thresh

def compose_alert_payload(latest_flat, score, reason, metrics_involved):
    """
    Build a JSON-friendly alert payload.
    """
    return {
        "timestamp": latest_flat.get('timestamp', datetime.utcnow().isoformat()),
        "location": latest_flat.get('location'),
        "metrics": {k: latest_flat.get(k) for k in metrics_involved},
        "detector": "isolationforest" if reason == 'isoforest' else 'zscore',
        "score": score,
        "reason": reason,
        "notified": False
    }

def detect_anomalies(readings: List[Dict]) -> List[Dict]:
    values = []
    valid = []
    for r in readings:
        v = r.get('value')
        if isinstance(v, (int, float)):
            values.append(float(v))
            valid.append(r)
    if len(values) < 3:
        return []
    mu = mean(values)
    sigma = pstdev(values)
    if sigma == 0:
        return []
    th = getattr(Config, 'ANOMALY_ZSCORE_THRESHOLD', 3.0)
    anomalies = []
    for r, v in zip(valid, values):
        z = abs((v - mu) / sigma)
        if z >= th:
            anomalies.append({
                'detected_at': datetime.utcnow(),
                'value': v,
                'zscore': z,
                'mean': mu,
                'std': sigma,
                'sensor': r.get('sensor'),
                'raw_id': r.get('_id')
            })
    return anomalies

def run_loop(metric_keys):
    print("Starting anomaly detector loop. Poll interval:", Config.POLL_INTERVAL_SECONDS)
    while True:
        try:
            rows = fetch_recent_readings(Config.ROLLING_WINDOW_MINUTES)
            if not rows:
                print("No readings in the last", Config.ROLLING_WINDOW_MINUTES, "minutes.")
                time.sleep(Config.POLL_INTERVAL_SECONDS)
                continue

            df = build_dataframe(rows, metric_keys)
            latest_flat = rows[-1]
            # Try multivariate isolation forest
            score, is_anomaly = detect_with_isolationforest(df, metric_keys)
            used_method = 'isoforest' if score is not None else 'none'
            if score is None:
                # fallback: check each metric's z-score
                anomalies = []
                for k in metric_keys:
                    if detect_with_zscore(df, k):
                        anomalies.append(k)
                if anomalies:
                    is_anomaly = True
                    used_method = 'zscore'
                    score = None
                else:
                    is_anomaly = False

            if is_anomaly:
                # Compose message and save alert
                alert_payload = compose_alert_payload(latest_flat, score, used_method, metric_keys)
                # attach which metrics are out of range by simple check (last vs 3*std)
                alert_payload['anomaly_metrics'] = []
                for k in metric_keys:
                    if detect_with_zscore(df, k):
                        alert_payload['anomaly_metrics'].append(k)

                alert_payload['createdAt'] = datetime.utcnow()
                # Save to MongoDB alerts collection
                res = alerts_col.insert_one(alert_payload)
                print("Inserted alert id:", res.inserted_id)

                # Send notifications
                subject = f"[ALERT] Air quality anomaly at {alert_payload.get('location') or 'unknown'}"
                body = f"Anomaly detected at {alert_payload['timestamp']}\n\nMetrics: {alert_payload['metrics']}\nMethod: {alert_payload['detector']}\nScore: {alert_payload['score']}\nAnomalous metrics: {alert_payload['anomaly_metrics']}\n\nPlease inspect devices."
                send_email(subject, body)
                if Config.USE_TWILIO:
                    send_sms(body[:160])  # SMS length limit
                if Config.BACKEND_ALERT_URL:
                    post_alert_to_backend(alert_payload)

            else:
                print(f"[{datetime.utcnow().isoformat()}] No anomaly detected (score={score})")

        except Exception as ex:
            print("Error in detector loop:", ex)
            traceback.print_exc()

        time.sleep(Config.POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    # Choose which metric keys to monitor (match your readings' metrics)
    metric_keys = ["pm25", "pm10", "co", "o3", "no2", "temperature", "humidity", "pressure", "light"]
    run_loop(metric_keys)
