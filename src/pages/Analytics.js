import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const metrics = [
  { label: 'PM2.5', key: 'pm25', color: '#8884d8' },
  { label: 'PM10', key: 'pm10', color: '#82ca9d' },
  { label: 'CO', key: 'co', color: '#ff7300' },
  { label: 'O3', key: 'o3', color: '#ff0000' },
  { label: 'NO2', key: 'no2', color: '#9c27b0' },
  { label: 'Temperature', key: 'temperature', color: '#ffb300' },
  { label: 'Humidity', key: 'humidity', color: '#00bcd4' },
  { label: 'Pressure', key: 'pressure', color: '#795548' },
  { label: 'Light', key: 'light', color: '#4caf50' },
];

const safeAvg = (arr, key) => {
  if (!arr.length) return 0;
  const sum = arr.reduce((acc, d) => acc + (Number(d[key]) || 0), 0);
  return sum / arr.length;
};

const pm25ToStatus = (v) => {
  if (v <= 50) return 'Good';
  if (v <= 100) return 'Moderate';
  if (v <= 150) return 'Unhealthy (SG)';
  if (v <= 200) return 'Unhealthy';
  if (v <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [rows, setRows] = useState([]);      // flattened rows for charts
  const [avgValues, setAvgValues] = useState({});
  const [aqiStatus, setAqiStatus] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/historical`, { params: { timeframe } });
        // Flatten: { timestamp, metrics:{...} } -> { timestamp, pm25, ... }
        const flat = (res.data || []).map(r => ({
          timestamp: r.timestamp,
          ...(r.metrics || {})
        }));
        setRows(flat);

        // Averages
        const averages = {};
        metrics.forEach(m => {
          averages[m.key] = Number(safeAvg(flat, m.key).toFixed(2));
        });
        setAvgValues(averages);

        // AQ status from avg PM2.5
        setAqiStatus(pm25ToStatus(averages.pm25 || 0));
      } catch (e) {
        console.error('Error fetching analytics data:', e);
        setRows([]);
        setAvgValues({});
        setAqiStatus('Error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeframe]);

  const pieData = metrics.map(m => ({
    name: m.label,
    value: Number(avgValues[m.key] || 0),
    color: m.color
  }));

  return (
    <div className="analytics-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Air Quality Analytics &amp; Insights</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setTimeframe('24h')}>Last 24h</button>
          <button onClick={() => setTimeframe('7d')}>Last 7 Days</button>
          <button onClick={() => setTimeframe('30d')}>Last 30 Days</button>
        </div>
      </div>

      <p>
        Overall Air Quality Status:&nbsp;
        <strong>{loading ? 'Loading...' : aqiStatus}</strong>
      </p>

      {/* Line Chart: trends */}
      <h3>Trends over Time ({timeframe})</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          {metrics.map(m => (
            <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Bar Chart: averages */}
      <h3 style={{ marginTop: 24 }}>Average Levels ({timeframe})</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={metrics.map(m => ({ metric: m.label, value: Number(avgValues[m.key] || 0) }))}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="metric" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      {/* Pie Chart: relative contribution */}
      <h3 style={{ marginTop: 24 }}>Relative Contribution of Metrics</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
            {pieData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Analytics;
