// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import FullDashboard from './pages/FullDashboard';
import RealTimeData from './pages/RealTimeData';
import HistoricalData from './pages/HistoricalData';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AIChatbot from './components/AIChatbot';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const ProtectedRoute = ({ children }) => {
  // Auth is frozen, so just render the requested route.
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <FullDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/real-time"
            element={(
              <ProtectedRoute>
                <RealTimeData />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/historical"
            element={(
              <ProtectedRoute>
                <HistoricalData />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/analytics"
            element={(
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={(
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )}
          />
        </Routes>
        <AIChatbot />
      </Layout>
    </AuthProvider>
  );
}

export default App;
