from typing import List, Dict
from statistics import mean
from config import Config

def simple_forecast(readings: List[Dict]):
    """
    Naive baseline: moving average then flat projection.
    Replace with ARIMA/LSTM later.
    """
    vals = [r.get('value') for r in readings if isinstance(r.get('value'), (int, float))]
    if not vals:
        return []
    window = min(len(vals), 20)
    ma = sum(vals[-window:]) / window
    horizon = Config.FORECAST_HORIZON
    return [{'step': i + 1, 'forecast_value': ma} for i in range(horizon)]