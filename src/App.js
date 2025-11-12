// src/App.js
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RealTimeData from "./pages/RealTimeData";
import HistoricalData from "./pages/HistoricalData";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import FullDashboard from "./pages/FullDashboard";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/real-time" replace />} />
        <Route path="/real-time" element={<RealTimeData />} />
        <Route path="/historical" element={<HistoricalData />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/Dashboard" element={<FullDashboard />} />
      </Routes>
    </Layout>
  );
}
