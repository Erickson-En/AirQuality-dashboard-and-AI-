// src/pages/RealTimeData.js
import React, { useEffect, useState, useMemo } from 'react';
import MetricCard from '../components/MetricCard';
import { api, socket } from '../config/api';
import { 
  ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, 
  Legend, Brush, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis
} from 'recharts';

const flattenReading = (payload) => (payload?.metrics
  ? { ...payload.metrics, timestamp: payload.timestamp, location: payload.location }
  : payload || {});

// Calculate AQI from PM2.5
const calculateAQI = (pm25) => {
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
};

const getAQICategory = (aqi) => {
  if (aqi <= 50) return { label: 'Good', color: '#00e400', icon: '😊' };
  if (aqi <= 100) return { label: 'Moderate', color: '#ffff00', icon: '😐' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#ff7e00', icon: '😷' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ff0000', icon: '😰' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8f3f97', icon: '😱' };
  return { label: 'Hazardous', color: '#7e0023', icon: '☠️' };
};

export default function RealTimeData(){
  const [metrics, setMetrics] = useState({});
  const [series, setSeries] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [updateCount, setUpdateCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Calculate statistics
  const stats = useMemo(() => {
    if (series.length === 0) return null;
    
    const calculate = (key) => {
      const values = series.map(s => s[key]).filter(v => v != null);
      if (values.length === 0) return null;
      
      return {
        current: values[values.length - 1],
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        trend: values.length > 1 ? values[values.length - 1] - values[values.length - 2] : 0
      };
    };

    return {
      pm25: calculate('pm25'),
      pm10: calculate('pm10'),
      co: calculate('co'),
      o3: calculate('o3'),
      temperature: calculate('temperature'),
      humidity: calculate('humidity')
    };
  }, [series]);

  // Calculate AQI
  const currentAQI = useMemo(() => {
    if (!metrics.pm25) return null;
    const aqi = calculateAQI(metrics.pm25);
    return { value: aqi, ...getAQICategory(aqi) };
  }, [metrics.pm25]);

  // Check for threshold violations
  const checkAlerts = (data) => {
    const newAlerts = [];
    const thresholds = {
      pm25: { value: 35.4, label: 'PM2.5' },
      pm10: { value: 154, label: 'PM10' },
      co: { value: 9, label: 'CO' },
      o3: { value: 70, label: 'O3' }
    };

    Object.keys(thresholds).forEach(key => {
      if (data[key] > thresholds[key].value) {
        newAlerts.push({
          id: Date.now() + key,
          type: 'warning',
          metric: thresholds[key].label,
          value: data[key],
          threshold: thresholds[key].value,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 5)); // Keep last 5 alerts
    }
  };

  useEffect(()=>{
    let active = true;

    const seedLatest = async () => {
      try {
        const resp = await api.get('/api/sensor-data/latest');
        if (!active || !resp?.data) return;
        const flat = flattenReading(resp.data);
        const ts = flat?.timestamp ? new Date(flat.timestamp).getTime() : Date.now();
        setMetrics(prev=>({ ...prev, ...flat }));
        setSeries(prev => [...prev.slice(-49), { ...flat, ts }]);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Failed to load latest sensor reading:', err);
      }
    };

    seedLatest();
    if (!socket.connected) socket.connect();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleSensor = (payload) => {
      if (!autoRefresh || !active) return;
      
      const flat = flattenReading(payload);
      const ts = flat?.timestamp ? new Date(flat.timestamp).getTime() : Date.now();
      setMetrics(prev=>({...prev, ...flat}));
      setSeries(prev => [...prev.slice(-49), {...flat, ts}]);
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
      checkAlerts(flat);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('sensorData', handleSensor);

    if (socket.connected) setIsConnected(true);

    return ()=> {
      active = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('sensorData', handleSensor);
    };
  },[autoRefresh]);

  // Export data functions
  const exportCSV = () => {
    const headers = ['Timestamp', 'PM2.5', 'PM10', 'CO', 'O3', 'Temperature', 'Humidity'];
    const rows = series.map(s => [
      new Date(s.ts).toLocaleString(),
      s.pm25 || '',
      s.pm10 || '',
      s.co || '',
      s.o3 || '',
      s.temperature || '',
      s.humidity || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtime-data-${new Date().toISOString()}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const json = JSON.stringify(series, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtime-data-${new Date().toISOString()}.json`;
    a.click();
  };

  const renderChart = () => {
    const commonProps = {
      data: series,
      syncId: "realtime"
    };

    const commonAxis = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="ts" 
          type="number" 
          scale="time" 
          domain={["auto","auto"]} 
          tickFormatter={v=>new Date(v).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
        />
        <YAxis width={52} tickLine={false} />
        <Tooltip labelFormatter={v=>new Date(v).toLocaleString()} />
        <Legend />
        <Brush height={14} travellerWidth={8} />
      </>
    );

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          {commonAxis}
          <Area type="monotone" dataKey="pm25" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Area type="monotone" dataKey="pm10" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
          <Area type="monotone" dataKey="co" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
        </AreaChart>
      );
    }

    return (
      <LineChart {...commonProps}>
        {commonAxis}
        <Line type="monotone" dataKey="pm25" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="pm10" stroke="#82ca9d" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="co" stroke="#ff7300" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
      </LineChart>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600' }}>
            Real-Time Monitoring
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: '14px', 
              color: isConnected ? '#00e400' : '#ff0000',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isConnected ? '#00e400' : '#ff0000',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {lastUpdate && (
              <span style={{ fontSize: '14px', color: '#666' }}>
                Last Update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <span style={{ fontSize: '14px', color: '#666' }}>
              Updates: {updateCount}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: autoRefresh ? '#00e400' : '#ccc',
              color: autoRefresh ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s'
            }}
          >
            {autoRefresh ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
          </button>
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: '#4CAF50',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={exportJSON}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: '#2196F3',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📥 Export JSON
          </button>
        </div>
      </div>

      {/* AQI Display */}
      {currentAQI && (
        <div style={{
          backgroundColor: currentAQI.color,
          color: '#fff',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Air Quality Index (AQI)
            </div>
            <div style={{ fontSize: '48px', fontWeight: '700' }}>
              {currentAQI.value}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>
              {currentAQI.icon}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              {currentAQI.label}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
            ⚠️ Recent Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px'
                }}
              >
                <span>
                  <strong>{alert.metric}</strong>: {alert.value.toFixed(2)} exceeds threshold of {alert.threshold}
                </span>
                <span style={{ color: '#666' }}>{alert.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Metrics */}
      <div className="cards-grid" style={{ marginBottom: '20px' }}>
        <MetricCard 
          title="PM2.5" 
          value={metrics.pm25} 
          unit="µg/m³"
          trend={stats?.pm25?.trend}
        />
        <MetricCard 
          title="PM10" 
          value={metrics.pm10} 
          unit="µg/m³"
          trend={stats?.pm10?.trend}
        />
        <MetricCard 
          title="CO" 
          value={metrics.co} 
          unit="ppm"
          trend={stats?.co?.trend}
        />
        <MetricCard 
          title="O3" 
          value={metrics.o3} 
          unit="ppb"
          trend={stats?.o3?.trend}
        />
        {metrics.temperature && (
          <MetricCard 
            title="Temperature" 
            value={metrics.temperature} 
            unit="°C"
            trend={stats?.temperature?.trend}
          />
        )}
        {metrics.humidity && (
          <MetricCard 
            title="Humidity" 
            value={metrics.humidity} 
            unit="%"
            trend={stats?.humidity?.trend}
          />
        )}
      </div>

      {/* Statistics Panel */}
      {showStats && stats && (
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Session Statistics
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            {Object.entries(stats).map(([key, stat]) => {
              if (!stat) return null;
              return (
                <div key={key} style={{ 
                  backgroundColor: '#fff', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', color: '#666' }}>
                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div>Current: <strong>{stat.current.toFixed(2)}</strong></div>
                    <div>Min: {stat.min.toFixed(2)}</div>
                    <div>Max: {stat.max.toFixed(2)}</div>
                    <div>Avg: {stat.avg.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="charts-row">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Real-Time Trends (Last 50 Readings)
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setChartType('line')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: chartType === 'line' ? '#2196F3' : '#fff',
                color: chartType === 'line' ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Line Chart
            </button>
            <button
              onClick={() => setChartType('area')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: chartType === 'area' ? '#2196F3' : '#fff',
                color: chartType === 'area' ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Area Chart
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
