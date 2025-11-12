import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { socket } from '../config/api';

const metricsList = [
  { label: 'PM2.5', key: 'pm25', unit: 'µg/m³', stroke: '#8884d8' },
  { label: 'PM10', key: 'pm10', unit: 'µg/m³', stroke: '#82ca9d' },
  { label: 'CO', key: 'co', unit: 'ppm', stroke: '#ff7300' },
  { label: 'O3', key: 'o3', unit: 'ppb', stroke: '#ff0000' },
  { label: 'NO2', key: 'no2', unit: 'ppb', stroke: '#9c27b0' },
  { label: 'Temperature', key: 'temperature', unit: '°C', stroke: '#ffb300' },
  { label: 'Humidity', key: 'humidity', unit: '%', stroke: '#00bcd4' },
  { label: 'Pressure', key: 'pressure', unit: 'hPa', stroke: '#795548' },
  { label: 'Light Intensity', key: 'light', unit: 'lux', stroke: '#4caf50' },
];

const RealTimeData = () => {
  const [current, setCurrent] = useState({});
  const [series, setSeries] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const onSensor = (data) => {
      setCurrent(data.metrics ? { ...data.metrics, timestamp: data.timestamp, location: data.location } : data);
      setSeries(prev => [...prev.slice(-49), (data.metrics ? { timestamp: data.timestamp, ...data.metrics } : data)]);
    };
    const onAlert = (alert) => setAlerts(prev => [alert, ...prev].slice(0, 5));

    socket.on('sensorData', onSensor);
    socket.on('alert', onAlert);
    return () => {
      socket.off('sensorData', onSensor);
      socket.off('alert', onAlert);
    };
  }, []);

  const aqiColor = (v = 0) =>
    v <= 50 ? '#4caf50' : v <= 100 ? '#ffeb3b' : v <= 150 ? '#ff9800' :
    v <= 200 ? '#f44336' : v <= 300 ? '#9c27b0' : '#7e0023';

  return (
    <div className="real-time-data">
      <h2>Real-Time Air Quality</h2>

      {alerts.map((a, i) => (
        <div key={i} className="alert-banner">Alert: {a.metric.toUpperCase()} = {a.value} (>{a.threshold})</div>
      ))}

      <div className="aqi-card" style={{ backgroundColor: aqiColor(current.pm25) }}>
        <h3>Current AQ (PM2.5)</h3>
        <p>{current.pm25 ?? '—'}</p>
      </div>

      <div className="pollutant-cards">
        {metricsList.map(m => (
          <div key={m.key} className="pollutant-card">
            <h4>{m.label}</h4>
            <p>{current[m.key] ?? '—'} {m.unit}</p>
          </div>
        ))}
      </div>

      <div className="charts-container">
        <h3>Real-Time Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            {metricsList.map(m => (
              <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.stroke} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RealTimeData;
