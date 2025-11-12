import React, { useEffect, useState } from 'react';
import { api } from '../config/api';

const metrics = [
  { label: 'PM2.5', key: 'pm25', default: 150, unit: 'µg/m³' },
  { label: 'PM10', key: 'pm10', default: 150, unit: 'µg/m³' },
  { label: 'CO', key: 'co', default: 10, unit: 'ppm' },
  { label: 'O3', key: 'o3', default: 100, unit: 'ppb' },
  { label: 'NO2', key: 'no2', default: 100, unit: 'ppb' },
  { label: 'Temperature', key: 'temperature', default: 35, unit: '°C' },
  { label: 'Humidity', key: 'humidity', default: 90, unit: '%' },
  { label: 'Pressure', key: 'pressure', default: 1050, unit: 'hPa' },
  { label: 'Light Intensity', key: 'light', default: 1000, unit: 'lux' },
];

const Settings = () => {
  const [thresholds, setThresholds] = useState(() =>
    metrics.reduce((acc, m) => ({ ...acc, [m.key]: m.default }), {})
  );
  const userId = 'admin'; // replace with real auth later

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/settings/${userId}`);
        if (data?.thresholds) setThresholds(data.thresholds);
      } catch (e) {
        console.warn('No saved settings yet, using defaults.');
      }
    })();
  }, []);

  const save = async () => {
    await api.post('/api/settings', { userId, thresholds });
    alert('Settings saved!');
  };

  return (
    <div className="settings-page">
      <h2>User Settings - Custom Alert Thresholds</h2>
      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 15 }}>
        {metrics.map(m => (
          <div key={m.key}>
            <label>{m.label} ({m.unit})</label>
            <input
              type="number"
              value={thresholds[m.key]}
              onChange={e => setThresholds(s => ({ ...s, [m.key]: Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>
      <button onClick={save} style={{ marginTop: 16 }}>Save Settings</button>
    </div>
  );
};

export default Settings;
