import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../config/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const metrics = [
  { label: 'PM2.5', key: 'pm25', fill: '#8884d8', unit: 'µg/m³' },
  { label: 'PM10', key: 'pm10', fill: '#82ca9d', unit: 'µg/m³' },
  { label: 'CO', key: 'co', fill: '#ff7300', unit: 'ppm' },
  { label: 'O3', key: 'o3', fill: '#ff0000', unit: 'ppb' },
  { label: 'NO2', key: 'no2', fill: '#9c27b0', unit: 'ppb' },
  { label: 'Temperature', key: 'temperature', fill: '#ffb300', unit: '°C' },
  { label: 'Humidity', key: 'humidity', fill: '#00bcd4', unit: '%' },
  { label: 'Pressure', key: 'pressure', fill: '#795548', unit: 'hPa' },
  { label: 'Light Intensity', key: 'light', fill: '#4caf50', unit: 'lux' },
];

const HistoricalData = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/historical', { params: { timeframe } });
        const flat = (data || []).map(r => ({ timestamp: r.timestamp, ...(r.metrics || {}) }));
        setRows(flat);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeframe]);

  const seriesByMetric = useMemo(() => {
    const map = {};
    metrics.forEach(m => (map[m.key] = []));
    rows.forEach(r => {
      metrics.forEach(m => {
        const v = r[m.key];
        map[m.key].push({
          timestamp: r.timestamp,
          value: typeof v === 'number' ? v : null,
        });
      });
    });
    return map;
  }, [rows]);

  return (
    <div className="historical-data-page">
      <h2>Historical Air Quality Data</h2>

      <div className="timeframe-buttons" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setTimeframe('24h')} disabled={timeframe === '24h'}>Last 24h</button>
        <button onClick={() => setTimeframe('7d')} disabled={timeframe === '7d'}>Last 7 Days</button>
        <button onClick={() => setTimeframe('30d')} disabled={timeframe === '30d'}>Last 30 Days</button>
      </div>

      {loading && <p>Loading data…</p>}
      {!loading && rows.length === 0 && <p>No data available for {timeframe}.</p>}

      <div
        className="charts-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {metrics.map((m) => (
          <div key={m.key} className="chart-card" style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
            <h4 style={{ margin: '0 0 8px' }}>
              {m.label} <span style={{ opacity: 0.7, fontWeight: 'normal' }}>({m.unit})</span>
            </h4>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={seriesByMetric[m.key]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => (value == null ? '—' : value)}
                    labelFormatter={(l) => `Time: ${l}`}
                  />
                  <Bar
                    dataKey="value"
                    name={m.label}
                    fill={m.fill}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricalData;
