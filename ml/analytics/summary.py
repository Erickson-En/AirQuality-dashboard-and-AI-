from datetime import datetime, timezone
from typing import List, Dict
from statistics import mean
from config import Config

def summarize(readings: List[Dict]):
    vals = [r.get('value') for r in readings if isinstance(r.get('value'), (int, float))]
    if not vals:
        return {}
    return {
        'generated_at': datetime.utcnow(),
        'count': len(vals),
        'min': min(vals),
        'max': max(vals),
        'avg': mean(vals)
    }