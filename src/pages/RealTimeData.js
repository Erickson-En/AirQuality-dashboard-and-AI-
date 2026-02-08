// src/pages/RealTimeData.js
import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import { api, socket } from '../config/api';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, Legend, Brush } from 'recharts';

const flattenReading = (payload) => (payload?.metrics
  ? { ...payload.metrics, timestamp: payload.timestamp, location: payload.location }
  : payload || {});

export default function RealTimeData(){
  const [metrics, setMetrics] = useState({});
  const [series, setSeries] = useState([]);

  useEffect(()=>{
    let active = true;

    const seedLatest = async () => {
      try {
        const resp = await api.get('/api/sensor-data/latest');
        if (!active || !resp?.data) return;
        const flat = flattenReading(resp.data);
        const ts = flat?.timestamp ? new Date(flat.timestamp).getTime() : Date.now();
        setMetrics(prev=>({ ...prev, ...flat }));
        setSeries(prev => [...prev.slice(-299), { ...flat, ts }]);
      } catch (err) {
        console.error('Failed to load latest sensor reading:', err);
      }
    };

    seedLatest();
    if (!socket.connected) socket.connect();

    const handleSensor = (payload) => {
      const flat = flattenReading(payload);
      const ts = flat?.timestamp ? new Date(flat.timestamp).getTime() : Date.now();
      setMetrics(prev=>({...prev, ...flat}));
      setSeries(prev => [...prev.slice(-299), {...flat, ts}]);
    };

    socket.on('sensorData', handleSensor);
    return ()=> {
      active = false;
      socket.off('sensorData', handleSensor);
    };
  },[]);

  return (
    <div>
      <div style={{marginBottom:12, display:'flex', gap:12}}>
        <div className="kv">Live Real-Time Metrics</div>
      </div>

      <div className="cards-grid">
        <MetricCard title="PM2.5" value={metrics.pm25} unit="µg/m³" />
        <MetricCard title="PM10" value={metrics.pm10} unit="µg/m³" />
        <MetricCard title="CO" value={metrics.co} unit="ppm" />
        <MetricCard title="O3" value={metrics.o3} unit="ppb" />
      </div>

      <div className="charts-row">
        <h3 style={{marginTop:18}}>Real-time trend (last 50 samples)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={series} syncId="realtime">
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="ts" type="number" scale="time" domain={["auto","auto"]} tickFormatter={v=>new Date(v).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} />
            <YAxis width={52} tickLine={false} />
            <Tooltip labelFormatter={v=>new Date(v).toLocaleString()} />
            <Legend />
            <Line type="monotone" dataKey="pm25" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            <Line type="monotone" dataKey="pm10" stroke="#82ca9d" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            <Line type="monotone" dataKey="co" stroke="#ff7300" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            <Brush height={14} travellerWidth={8} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
