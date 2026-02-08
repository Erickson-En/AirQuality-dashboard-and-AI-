import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css'; // Import the CSS Module
import { getAqiInfo } from '../utils/aqiUtils'; // Import the helper

// --- Reusable Sub-Components ---

/**
 * A small, reusable chart for a single pollutant trend.
 */
const TrendChart = ({ title, data, dataKey, strokeColor, unit }) => (
  <div className={styles.card} data-grid-area={title.toLowerCase().replace('.', '')}>
    <h3>{title} Trend ({unit})</h3>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis dataKey="time" fontSize="0.8rem" />
        <YAxis fontSize="0.8rem" />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          name={title}
          stroke={strokeColor} 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

/**
 * A small card for displaying a single parameter value.
 */
const ParameterCard = ({ label, value, unit }) => (
  <div className={styles.paramItem}>
    <div className={styles.paramLabel}>{label}</div>
    <span className={styles.paramValue}>{value ?? 'N/A'}</span>
    <span className={styles.paramUnit}>{unit}</span>
  </div>
);

// --- Main Dashboard Component ---

const Dashboard = () => {
  const [aqi, setAqi] = useState(null);
  const [pollutantData, setPollutantData] = useState({});
  const [metData, setMetData] = useState({});
  const [historicalData, setHistoricalData] = useState([]);

  const aqiInfo = getAqiInfo(aqi); // Get color and status

  useEffect(() => {
    // Fetch real-time AQI data from API
    axios.get(`https://api.waqi.info/feed/geo:1.2921;36.8219/?token=be388c46da5af11332632893a165a759e4d60e81`)
      .then(response => {
        const data = response.data.data;
        const iaqi = data.iaqi || {};
        
        setAqi(data.aqi);

        // Group data logically
        setPollutantData({
          pm25: iaqi.pm25?.v,
          pm10: iaqi.pm10?.v,
          co: iaqi.co?.v,
          o3: iaqi.o3?.v,
          no2: iaqi.no2?.v,
        });

        setMetData({
          temperature: iaqi.t?.v,
          humidity: iaqi.h?.v,
          pressure: iaqi.p?.v,
          light: iaqi.l?.v, // Note: 'l' for light is not standard WAQI
        });

        // Generate dummy historical data
        const dummyHistory = [];
        for (let i = 0; i < 24; i++) {
          dummyHistory.push({
            time: `${i}:00`,
            pm25: Math.max(0, (iaqi.pm25?.v || 50) + Math.random() * 10 - 5),
            pm10: Math.max(0, (iaqi.pm10?.v || 40) + Math.random() * 10 - 5),
            co: Math.max(0, (iaqi.co?.v || 2) + Math.random() - 0.5),
            o3: Math.max(0, (iaqi.o3?.v || 30) + Math.random() * 2 - 1),
            no2: Math.max(0, (iaqi.no2?.v || 10) + Math.random() * 2 - 1),
          });
        }
        setHistoricalData(dummyHistory);
      })
      .catch(error => console.error("Error fetching data", error));
  }, []);

  return (
    // No outer container needed, this component lives inside your <Layout>
    <div className={styles.dashboardGrid}>
      
      {/* 1. AQI Hero Card */}
      <div className={`${styles.card} ${styles.aqiHero}`}>
        <h3>Current Air Quality (AQI)</h3>
        <div className={`${styles.aqiValue} ${styles[aqiInfo.colorClass]}`}>
          {aqi ?? '---'}
        </div>
        <div className={`${styles.aqiStatus} ${styles[aqiInfo.colorClass]}`}>
          {aqiInfo.status}
        </div>
        <p className={styles.aqiDescription}>{aqiInfo.description}</p>
      </div>

      {/* 2. Pollutant Details Card */}
      <div className={`${styles.card} ${styles.pollutantsCard}`}>
        <h3>Pollutant Details</h3>
        <div className={styles.paramGrid}>
          <ParameterCard label="PM2.5" value={pollutantData.pm25} unit="µg/m³" />
          <ParameterCard label="PM10" value={pollutantData.pm10} unit="µg/m³" />
          <ParameterCard label="O3" value={pollutantData.o3} unit="ppb" />
          <ParameterCard label="NO2" value={pollutantData.no2} unit="ppb" />
          <ParameterCard label="CO" value={pollutantData.co} unit="ppm" />
        </div>
      </div>

      {/* 3. Meteorological Data Card */}
      <div className={`${styles.card} ${styles.meteoCard}`}>
        <h3>Meteorological Data</h3>
        <div className={styles.paramGrid}>
          <ParameterCard label="Temperature" value={metData.temperature} unit="°C" />
          <ParameterCard label="Humidity" value={metData.humidity} unit="%" />
          <ParameterCard label="Pressure" value={metData.pressure} unit="hPa" />
          <ParameterCard label="Light" value={metData.light} unit="lux" />
        </div>
      </div>

      {/* 4. Trend Charts (Small Multiples) */}
      <TrendChart 
        title="PM2.5" 
        data={historicalData} 
        dataKey="pm25" 
        strokeColor="#8884d8" 
        unit="µg/m³" 
      />
      <TrendChart 
        title="PM10" 
        data={historicalData} 
        dataKey="pm10" 
        strokeColor="#82ca9d" 
        unit="µg/m³" 
      />
      <TrendChart 
        title="O3" 
        data={historicalData} 
        dataKey="o3" 
        strokeColor="#ffc658" 
        unit="ppb" 
      />
      <TrendChart 
        title="NO2" 
        data={historicalData} 
        dataKey="no2" 
        strokeColor="#ff7300" 
        unit="ppb" 
      />
      <TrendChart 
        title="CO" 
        data={historicalData} 
        dataKey="co" 
        strokeColor="#d0ed57" 
        unit="ppm" 
      />
      {/* You can add a 6th chart here if needed, or adjust the grid-template-areas */}
    </div>
  );
}

export default Dashboard;