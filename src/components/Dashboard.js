import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './Header';

const Dashboard = () => {
  const [airQualityData, setAirQualityData] = useState({});
  const [aqi, setAqi] = useState(null);

  // Simulated historical data for trends (we'll generate dummy data for now)
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    // Fetch real-time AQI data from API
    axios.get(`https://api.waqi.info/feed/geo:1.2921;36.8219/?token=be388c46da5af11332632893a165a759e4d60e81`)
      .then(response => {
        const data = response.data.data;
        setAqi(data.aqi);
        setAirQualityData({
          pm25: data.iaqi.pm25 ? data.iaqi.pm25.v : 0,
          pm10: data.iaqi.pm10 ? data.iaqi.pm10.v : 0,
          co: data.iaqi.co ? data.iaqi.co.v : 0,
          o3: data.iaqi.o3 ? data.iaqi.o3.v : 0,
          no2: data.iaqi.no2 ? data.iaqi.no2.v : 0,
          temperature: data.iaqi.t ? data.iaqi.t.v : 0,
          humidity: data.iaqi.h ? data.iaqi.h.v : 0,
          pressure: data.iaqi.p ? data.iaqi.p.v : 0,
          light: data.iaqi.l ? data.iaqi.l.v : 0
        });

        // Generate dummy historical data for charts
        const dummyHistory = [];
        for (let i = 0; i < 24; i++) {
          dummyHistory.push({
            time: `${i}:00`,
            pm25: Math.max(0, (data.iaqi.pm25?.v || 50) + Math.random() * 10 - 5),
            pm10: Math.max(0, (data.iaqi.pm10?.v || 40) + Math.random() * 10 - 5),
            co: Math.max(0, (data.iaqi.co?.v || 2) + Math.random() - 0.5),
            o3: Math.max(0, (data.iaqi.o3?.v || 30) + Math.random() * 2 - 1),
            no2: Math.max(0, (data.iaqi.no2?.v || 10) + Math.random() * 2 - 1),
          });
        }
        setHistoricalData(dummyHistory);

      })
      .catch(error => console.error("Error fetching data", error));
  }, []);

  // Render a card for each parameter
  const renderParameterCard = (label, value, unit) => (
    <div className="parameter-card">
      <h3>{label}</h3>
      <p>{value} {unit}</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Header />

      {/* Current AQI and Parameter Cards */}
      <div className="current-data">
        <h2>Current AQI: {aqi}</h2>
        <div className="parameter-cards-grid">
          {renderParameterCard("PM2.5", airQualityData.pm25, "µg/m³")}
          {renderParameterCard("PM10", airQualityData.pm10, "µg/m³")}
          {renderParameterCard("CO", airQualityData.co, "ppm")}
          {renderParameterCard("O3", airQualityData.o3, "ppb")}
          {renderParameterCard("NO2", airQualityData.no2, "ppb")}
          {renderParameterCard("Temperature", airQualityData.temperature, "°C")}
          {renderParameterCard("Humidity", airQualityData.humidity, "%")}
          {renderParameterCard("Pressure", airQualityData.pressure, "hPa")}
          {renderParameterCard("Light Intensity", airQualityData.light, "lux")}
        </div>
      </div>

      {/* Trend Charts */}
      <div className="charts-container">
        <h3>Trends (Last 24 Hours)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pm25" stroke="#8884d8" />
            <Line type="monotone" dataKey="pm10" stroke="#82ca9d" />
            <Line type="monotone" dataKey="co" stroke="#ff7300" />
            <Line type="monotone" dataKey="o3" stroke="#ff0000" />
            <Line type="monotone" dataKey="no2" stroke="#9c27b0" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;
