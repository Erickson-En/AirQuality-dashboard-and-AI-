// src/pages/HistoricalData.js
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../config/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  ReferenceLine
} from 'recharts';

const metrics = [
  { label: 'PM2.5', key: 'pm25', stroke: '#00e5ff', unit: 'µg/m³', threshold: 35, category: 'air' },
  { label: 'PM10', key: 'pm10', stroke: '#7d4bff', unit: 'µg/m³', threshold: 150, category: 'air' },
  { label: 'CO', key: 'co', stroke: '#ff7a00', unit: 'ppm', threshold: 9, category: 'air' },
  { label: 'O3', key: 'o3', stroke: '#ff1f7a', unit: 'ppb', threshold: 100, category: 'air' },
  { label: 'NO2', key: 'no2', stroke: '#9c27b0', unit: 'ppb', threshold: 100, category: 'air' },
  { label: 'Temperature', key: 'temperature', stroke: '#ffb300', unit: '°C', threshold: null, category: 'env' },
  { label: 'Humidity', key: 'humidity', stroke: '#00bcd4', unit: '%', threshold: null, category: 'env' },
  { label: 'Pressure', key: 'pressure', stroke: '#795548', unit: 'hPa', threshold: null, category: 'env' },
  { label: 'Light', key: 'light', stroke: '#4caf50', unit: 'lux', threshold: null, category: 'env' }
];

export default function HistoricalData() {
  const [timeframe, setTimeframe] = useState('24h');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, combined, table
  const [selectedMetrics, setSelectedMetrics] = useState(metrics.slice(0, 5).map(m => m.key));
  const [stats, setStats] = useState({});
  const [showThresholds, setShowThresholds] = useState(true);
  const [chartType, setChartType] = useState('line'); // line, area

  // Fetch data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const params = {};

        if (start || end) {
          if (start) params.start = start;
          if (end) params.end = end;
        } else {
          params.timeframe = timeframe;
        }

        const resp = await api.get('/api/historical', { params });

        const flat = (resp.data || []).map(r => ({
          timestamp: r.timestamp,
          ts: r.timestamp ? new Date(r.timestamp).getTime() : null,
          ...(r.metrics || {})
        }));

        setRows(flat);
        
        // Calculate statistics
        calculateStats(flat);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [timeframe, start, end]);
  
  // Calculate statistics for each metric
  const calculateStats = (data) => {
    const statistics = {};
    
    metrics.forEach(m => {
      const values = data.map(d => Number(d[m.key] || 0)).filter(v => v > 0);
      
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        // Standard deviation
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Exceedances (if threshold exists)
        let exceedances = 0;
        let exceedancePercentage = 0;
        if (m.threshold) {
          exceedances = values.filter(v => v > m.threshold).length;
          exceedancePercentage = (exceedances / values.length) * 100;
        }
        
        statistics[m.key] = {
          min: min.toFixed(2),
          max: max.toFixed(2),
          mean: mean.toFixed(2),
          median: median.toFixed(2),
          stdDev: stdDev.toFixed(2),
          count: values.length,
          exceedances,
          exceedancePercentage: exceedancePercentage.toFixed(1)
        };
      }
    });
    
    setStats(statistics);
  };
  
  // Toggle metric selection
  const toggleMetric = (key) => {
    setSelectedMetrics(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Prepare line series
  const seriesByMetric = useMemo(() => {
    const map = {};
    metrics.forEach(m => (map[m.key] = []));

    rows.forEach(r => {
      metrics.forEach(m => {
        map[m.key].push({
          ts: r.ts,
          timestamp: r.timestamp,
          value: r[m.key] ?? null
        });
      });
    });

    return map;
  }, [rows]);

  // Time formatting
  const timeTickFormatter = (value) => {
    try {
      const d = new Date(value);
      if (timeframe === '5m' || timeframe === '24h')
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (timeframe === '7d' || timeframe === '30d')
        return d.toLocaleDateString();

      return d.toLocaleString();
    } catch {
      return value;
    }
  };

  const tooltipFormatter = (metric) => (val) => {
    const m = metrics.find(x => x.key === metric);
    return [val, `${m?.label} (${m?.unit})`];
  };

  const tooltipLabelFormatter = (label) => {
    try {
      return new Date(label).toLocaleString();
    } catch {
      return label;
    }
  };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 'bold' }}>📊 Historical Data Analysis</h2>
        <p style={{ margin: '4px 0 0 0', opacity: 0.7, fontSize: 14 }}>
          Comprehensive historical data with statistics, trends, and multi-view analysis
        </p>
      </div>
      
      {/* Controls Panel */}
      <div style={{ 
        background: 'var(--card-bg, #fff)', 
        padding: 16, 
        borderRadius: 12, 
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Timeframe Selection */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn" onClick={() => { setStart(''); setEnd(''); setTimeframe('5m'); }}
              style={{ background: !start && !end && timeframe === '5m' ? 'var(--accent)' : '' }}>
              5 mins
            </button>
            <button className="btn" onClick={() => { setStart(''); setEnd(''); setTimeframe('24h'); }}
              style={{ background: !start && !end && timeframe === '24h' ? 'var(--accent)' : '' }}>
              24 hours
            </button>
            <button className="btn" onClick={() => { setStart(''); setEnd(''); setTimeframe('7d'); }}
              style={{ background: !start && !end && timeframe === '7d' ? 'var(--accent)' : '' }}>
              7 days
            </button>
            <button className="btn" onClick={() => { setStart(''); setEnd(''); setTimeframe('30d'); }}
              style={{ background: !start && !end && timeframe === '30d' ? 'var(--accent)' : '' }}>
              30 days
            </button>
          </div>

          <div style={{ height: 24, width: 1, background: 'rgba(0,0,0,0.1)' }} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: '500' }}>Custom Range:</label>
            <input 
              type="datetime-local" 
              value={start} 
              onChange={(e) => setStart(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)' }}
            />
            <span>to</span>
            <input 
              type="datetime-local" 
              value={end} 
              onChange={(e) => setEnd(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.2)' }}
            />
            {(start || end) && (
              <button className="btn" onClick={() => { setStart(''); setEnd(''); }}>Clear</button>
            )}
          </div>
        </div>
        
        {/* View Mode & Chart Options */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: '500', marginRight: 4 }}>View:</span>
            <button 
              className="btn" 
              onClick={() => setViewMode('grid')}
              style={{ background: viewMode === 'grid' ? 'var(--accent)' : '' }}>
              📊 Grid
            </button>
            <button 
              className="btn" 
              onClick={() => setViewMode('combined')}
              style={{ background: viewMode === 'combined' ? 'var(--accent)' : '' }}>
              📈 Combined
            </button>
            <button 
              className="btn" 
              onClick={() => setViewMode('table')}
              style={{ background: viewMode === 'table' ? 'var(--accent)' : '' }}>
              📋 Table
            </button>
          </div>
          
          <div style={{ height: 20, width: 1, background: 'rgba(0,0,0,0.1)' }} />
          
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: '500', marginRight: 4 }}>Chart:</span>
            <button 
              className="btn" 
              onClick={() => setChartType('line')}
              style={{ background: chartType === 'line' ? 'var(--accent)' : '' }}>
              Line
            </button>
            <button 
              className="btn" 
              onClick={() => setChartType('area')}
              style={{ background: chartType === 'area' ? 'var(--accent)' : '' }}>
              Area
            </button>
          </div>
          
          <div style={{ height: 20, width: 1, background: 'rgba(0,0,0,0.1)' }} />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showThresholds} 
              onChange={(e) => setShowThresholds(e.target.checked)}
            />
            <span style={{ fontSize: 13 }}>Show Thresholds</span>
          </label>
          
          <div style={{ marginLeft: 'auto', fontSize: 13, opacity: 0.7 }}>
            📊 {rows.length} data points
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      {!loading && rows.length > 0 && (
        <div style={{ 
          background: 'var(--card-bg, #fff)', 
          padding: 16, 
          borderRadius: 12, 
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>📈 Statistical Summary</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 12 
          }}>
            {metrics.filter(m => stats[m.key]).map(m => {
              const st = stats[m.key];
              return (
                <div key={m.key} style={{ 
                  padding: 12, 
                  background: 'rgba(0,0,0,0.02)', 
                  borderRadius: 8,
                  borderLeft: `4px solid ${m.stroke}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: m.stroke }}>
                    {m.label} ({m.unit})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                    <div>Min: <strong>{st.min}</strong></div>
                    <div>Max: <strong>{st.max}</strong></div>
                    <div>Mean: <strong>{st.mean}</strong></div>
                    <div>Median: <strong>{st.median}</strong></div>
                    <div>Std Dev: <strong>{st.stdDev}</strong></div>
                    <div>Samples: <strong>{st.count}</strong></div>
                    {m.threshold && st.exceedances > 0 && (
                      <>
                        <div style={{ gridColumn: 'span 2', color: '#ef4444', fontWeight: 'bold' }}>
                          ⚠️ Exceeded threshold {st.exceedances} times ({st.exceedancePercentage}%)
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Metric Selector (for combined view) */}
      {viewMode === 'combined' && (
        <div style={{ 
          background: 'var(--card-bg, #fff)', 
          padding: 12, 
          borderRadius: 12, 
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: 13, fontWeight: '500', marginRight: 12 }}>Select Metrics:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {metrics.map(m => (
              <label key={m.key} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6, 
                padding: '6px 12px', 
                background: selectedMetrics.includes(m.key) ? m.stroke + '20' : 'rgba(0,0,0,0.05)',
                borderRadius: 20,
                cursor: 'pointer',
                border: selectedMetrics.includes(m.key) ? `2px solid ${m.stroke}` : '2px solid transparent',
                transition: 'all 0.2s'
              }}>
                <input 
                  type="checkbox" 
                  checked={selectedMetrics.includes(m.key)}
                  onChange={() => toggleMetric(m.key)}
                />
                <span style={{ fontSize: 13, fontWeight: selectedMetrics.includes(m.key) ? 'bold' : 'normal' }}>
                  {m.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Loading & no data */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <p>Loading historical data...</p>
        </div>
      )}
      {!loading && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, background: 'var(--card-bg, #fff)', borderRadius: 12 }}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p>No data available for the selected time period</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && rows.length > 0 && viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 16
        }}>
          {metrics.map(m => {
            const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
            const DataComponent = chartType === 'area' ? Area : Line;
            
            return (
              <div key={m.key} style={{ 
                background: 'var(--card-bg, #fff)', 
                padding: 16, 
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: 12, 
                  fontSize: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    {m.label} <span style={{ fontSize: 12, opacity: 0.6 }}>({m.unit})</span>
                  </span>
                  {stats[m.key] && (
                    <span style={{ fontSize: 14, color: m.stroke }}>
                      Avg: {stats[m.key].mean}
                    </span>
                  )}
                </div>

                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={seriesByMetric[m.key]} syncId="history">
                      <defs>
                        <linearGradient id={`gradient-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={m.stroke} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={m.stroke} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        scale="time"
                        domain={['auto', 'auto']}
                        tickFormatter={timeTickFormatter}
                        stroke="rgba(0,0,0,0.5)"
                      />
                      <YAxis width={60} stroke="rgba(0,0,0,0.5)" />
                      <Tooltip
                        labelFormatter={tooltipLabelFormatter}
                        formatter={tooltipFormatter(m.key)}
                        contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8, color: '#fff' }}
                      />
                      {showThresholds && m.threshold && (
                        <ReferenceLine 
                          y={m.threshold} 
                          stroke="#ef4444" 
                          strokeDasharray="5 5" 
                          label={{ value: `Threshold: ${m.threshold}`, fill: '#ef4444', fontSize: 11 }}
                        />
                      )}
                      <DataComponent
                        type="monotone"
                        dataKey="value"
                        stroke={m.stroke}
                        strokeWidth={2}
                        fill={chartType === 'area' ? `url(#gradient-${m.key})` : 'none'}
                        dot={false}
                        activeDot={{ r: 6 }}
                        isAnimationActive={false}
                      />
                      <Brush height={18} travellerWidth={10} stroke={m.stroke} />
                    </ChartComponent>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Combined View */}
      {!loading && rows.length > 0 && viewMode === 'combined' && (
        <div style={{ 
          background: 'var(--card-bg, #fff)', 
          padding: 16, 
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Combined Metrics View</h3>
          <div style={{ width: '100%', height: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="ts"
                  type="number"
                  scale="time"
                  domain={['auto', 'auto']}
                  tickFormatter={timeTickFormatter}
                  stroke="rgba(0,0,0,0.5)"
                />
                <YAxis stroke="rgba(0,0,0,0.5)" />
                <Tooltip
                  labelFormatter={tooltipLabelFormatter}
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8, color: '#fff' }}
                />
                <Legend />
                {metrics.filter(m => selectedMetrics.includes(m.key)).map(m => (
                  <Line
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.stroke}
                    strokeWidth={2}
                    dot={false}
                    name={`${m.label} (${m.unit})`}
                  />
                ))}
                <Brush height={24} travellerWidth={12} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Table View */}
      {!loading && rows.length > 0 && viewMode === 'table' && (
        <div style={{ 
          background: 'var(--card-bg, #fff)', 
          padding: 16, 
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Data Table</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.05)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Timestamp</th>
                {metrics.map(m => (
                  <th key={m.key} style={{ padding: 10, textAlign: 'right' }}>
                    {m.label} ({m.unit})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: 10 }}>{new Date(row.timestamp).toLocaleString()}</td>
                  {metrics.map(m => {
                    const value = row[m.key];
                    const isExceeded = m.threshold && value > m.threshold;
                    return (
                      <td 
                        key={m.key} 
                        style={{ 
                          padding: 10, 
                          textAlign: 'right',
                          color: isExceeded ? '#ef4444' : 'inherit',
                          fontWeight: isExceeded ? 'bold' : 'normal'
                        }}
                      >
                        {value ? Number(value).toFixed(2) : '-'}
                        {isExceeded && ' ⚠️'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 100 && (
            <div style={{ marginTop: 12, textAlign: 'center', opacity: 0.7, fontSize: 12 }}>
              Showing first 100 of {rows.length} records
            </div>
          )}
        </div>
      )}
    </div>
  );
}
