// src/pages/FullDashboard.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import MetricCard from "../components/MetricCard";
import { api, socket } from "../config/api";

// Threshold limits
const LIMITS = {
  pm1: 50,
  pm25: 150,
  pm10: 200,
  co: 9,
  co2: 1000,
  o3: 120,
  no2: 200,
  temperature: 40,
  humidity: 90,
  voc_index: 250,
  nox_index: 250
};

// Card severity colors
const SEVERITY_COLORS = {
  GOOD: "linear-gradient(180deg,#00ff8a,#00b3ff)",
  MODERATE: "linear-gradient(180deg,#fff176,#fbc02d)",
  BAD: "linear-gradient(180deg,#ff9800,#f57c00)",
  HAZARDOUS: "linear-gradient(180deg,#ff5252,#c62828)",
};

const list = [
  { label: "PM1.0", key:"pm1", unit:"µg/m³" },
  { label: "PM2.5", key:"pm25", unit:"µg/m³" },
  { label: "PM10", key:"pm10", unit:"µg/m³" },
  { label: "CO", key:"co", unit:"ppm" },
  { label: "CO₂", key:"co2", unit:"ppm" },
  { label: "Temp", key:"temperature", unit:"°C" },
  { label: "Humidity", key:"humidity", unit:"%" },
  { label: "VOC", key:"voc_index", unit:"index" },
  { label: "NOx", key:"nox_index", unit:"index" }
];

// Flatten incoming data
const flattenReading = (payload) =>
  payload?.metrics
    ? { ...payload.metrics, timestamp: payload.timestamp, location: payload.location }
    : payload || {};

export default function FullDashboard() {
  const [metrics, setMetrics] = useState({});
  const [airStatus, setAirStatus] = useState("GOOD");
  const [causes, setCauses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Determine severity based on value vs threshold (memoized)
  const getSeverity = useCallback((key, value) => {
    const limit = LIMITS[key];
    if (value == null) return "GOOD";

    if (value < limit * 0.5) return "GOOD";
    if (value < limit) return "MODERATE";
    if (value < limit * 2) return "BAD";
    return "HAZARDOUS";
  }, []);

  // 🔥 Evaluate overall air quality & track causes (memoized)
  const evaluateAirQuality = useCallback((data) => {
    let worstLevel = "GOOD";
    let pollutantCauses = [];

    for (const key in LIMITS) {
      const value = data[key];
      if (value === undefined) continue;

      const level = getSeverity(key, value);

      // Track pollutants that are BAD or worse
      if (level === "BAD" || level === "HAZARDOUS") {
        pollutantCauses.push({ key, value, level });
      }

      // Determine worst level among all pollutants
      const rank = ["GOOD", "MODERATE", "BAD", "HAZARDOUS"];
      if (rank.indexOf(level) > rank.indexOf(worstLevel)) {
        worstLevel = level;
      }
    }

    setAirStatus(worstLevel);
    setCauses(pollutantCauses);
  }, [getSeverity]);

  useEffect(() => {
    let isMounted = true;

    const hydrateFromLatest = async () => {
      try {
        const resp = await api.get("/api/sensor-data/latest");
        if (!isMounted || !resp?.data) return;

        const flat = flattenReading(resp.data);
        setMetrics(prev => ({ ...prev, ...flat }));
        evaluateAirQuality(flat);
        setIsLoading(false);

        const last = document.getElementById("last-update");
        if (last && flat.timestamp) {
          last.innerText = new Date(flat.timestamp).toLocaleTimeString();
        }
      } catch (err) {
        console.error("Failed to hydrate latest:", err);
        setIsLoading(false);
      }
    };

    hydrateFromLatest();
    if (!socket.connected) socket.connect();

    const handleSensor = (payload) => {
      const flat = flattenReading(payload);

      setMetrics(prev => ({ ...prev, ...flat }));
      evaluateAirQuality(flat);

      const last = document.getElementById("last-update");
      if (last) {
        last.innerText = new Date(flat.timestamp || Date.now()).toLocaleTimeString();
      }
    };

    socket.on("sensorData", handleSensor);

    return () => {
      isMounted = false;
      socket.off("sensorData", handleSensor);
    };
  }, []);

  return (
    <div>

      {/* 🔥 MAIN AIR QUALITY ALERT */}
      <div
        style={{
          padding: "15px",
          marginBottom: "20px",
          borderRadius: "12px",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "1.3rem",
          background:
            airStatus === "GOOD" ? "#4caf50" :
            airStatus === "MODERATE" ? "#ffeb3b" :
            airStatus === "BAD" ? "#ff9800" :
            "#d32f2f",
          color: airStatus === "MODERATE" ? "#000" : "#fff",
        }}
      >
        Air Quality: {airStatus}
        <br />

        {/* 🔥 Show causes only when needed */}
        {causes.length > 0 && (
          <div style={{ fontSize: "1rem", marginTop: "5px" }}>
            Pollutants above safe limits:
            {causes.map((c, i) => (
              <div key={i}>
                <b>{c.key.toUpperCase()}</b> = {c.value} ({c.level})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 METRIC CARDS WITH SEVERITY COLORS */}
      <div className="cards-grid">
        {list.map(item => {
          const sev = getSeverity(item.key, metrics[item.key]);
          const color = SEVERITY_COLORS[sev];

          return (
            <MetricCard
              key={item.key}
              title={item.label}
              value={metrics[item.key]}
              unit={item.unit}
              color={color}
            />
          );
        })}
      </div>
    </div>
  );
}
