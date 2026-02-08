# ml/anomaly/utils.py
import pandas as pd

def flatten_reading(doc):
    """
    Input doc shape:
      { _id, timestamp, location, metrics: {pm25, pm10,...} }
    Returns flat dict:
      { timestamp: ..., location: ..., pm25:..., pm10:..., ... }
    """
    flat = {}
    flat['timestamp'] = pd.to_datetime(doc.get('timestamp') or doc.get('createdAt') or doc.get('_id').generation_time)
    flat['location'] = doc.get('location')
    metrics = doc.get('metrics') or {}
    for k, v in metrics.items():
        flat[k] = v
    return flat
