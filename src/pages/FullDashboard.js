import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Backend URL

const metricsList = [
  { label: 'PM2.5', key: 'pm25', unit: 'µg/m³', stroke: '#39349bff' },
  { label: 'PM10', key: 'pm10', unit: 'µg/m³', stroke: '#82ca9d' },
  { label: 'CO', key: 'co', unit: 'ppm', stroke: '#ff7300' },
  { label: 'O3', key: 'o3', unit: 'ppb', stroke: '#ff0000' },
  { label: 'NO2', key: 'no2', unit: 'ppb', stroke: '#9c27b0' },
  { label: 'Temperature', key: 'temperature', unit: '°C', stroke: '#ffb300' },
  { label: 'Humidity', key: 'humidity', unit: '%', stroke: '#00bcd4' },
  { label: 'Pressure', key: 'pressure', unit: 'hPa', stroke: '#795548' },
  { label: 'Light Intensity', key: 'light', unit: 'lux', stroke: '#4caf50' },
];

const FullDashboard = () => {
  const [currentData, setCurrentData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const onSensorData = (payload) => {
      // Flatten backend payload: {timestamp, location, metrics:{...}} -> {timestamp, location, pm25, ...}
      const flat = payload?.metrics
        ? { timestamp: payload.timestamp, location: payload.location, ...payload.metrics }
        : payload;

      setCurrentData(flat);
      setChartData((prev) => [...prev.slice(-49), flat]);

      // Simple local alert rule (in addition to backend 'alert' events)
      const local = [];
      if ((flat.pm25 ?? 0) > 150 || (flat.pm10 ?? 0) > 150) {
        local.push('Air quality is unhealthy! Limit outdoor activity.');
      }
      if (local.length) setAlerts((prev) => [...local, ...prev].slice(0, 5));
    };

    const onAlert = (alert) => {
      // alert = { metric, value, threshold, severity, ... }
      const msg = `Alert: ${alert.metric.toUpperCase()} = ${alert.value} (>${alert.threshold})`;
      setAlerts((prev) => [msg, ...prev].slice(0, 5));
    };

    socket.on('sensorData', onSensorData);
    socket.on('alert', onAlert);

    return () => {
      socket.off('sensorData', onSensorData);
      socket.off('alert', onAlert);
    };
  }, []);

  const getAqiColor = (value = 0) => {
    if (value <= 50) return '#4caf50';
    if (value <= 100) return '#ffeb3b';
    if (value <= 150) return '#ff9800';
    if (value <= 200) return '#f44336';
    if (value <= 300) return '#9c27b0';
    return '#7e0023';
  };

  return (
    <div className="full-dashboard">
      <h2>Full Air Quality Dashboard (Real-Time)</h2>

      {/* Alerts */}
      {alerts.map((alert, idx) => (
        <div key={idx} className="alert-banner">{alert}</div>
      ))}

      {/* AQI Card (demo uses PM2.5 as AQ indicator) */}
      <div className="aqi-card" style={{ backgroundColor: getAqiColor(currentData.pm25) }}>
        <h3>Current AQ (PM2.5)</h3>
        <p>{currentData.pm25 ?? 'Loading...'}</p>
        <small>{currentData.location ? `Location: ${currentData.location}` : ''}</small>
      </div>

      {/* Metric Cards */}
      <div className="pollutant-cards">
        {metricsList.map((m) => (
          <div key={m.key} className="pollutant-card">
            <h4>{m.label}</h4>
            <p>{currentData[m.key] ?? 'N/A'} {m.unit}</p>
          </div>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="historical-charts">
        <h3>Real-Time Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            {metricsList.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.stroke}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FullDashboard;
