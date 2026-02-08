// src/components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar(){
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path;
  return (
    <div>
      <div className="brand">
        <div className="logo" />
        <h1>AIR QUALITY <span style={{color:'#b9f0d6'}}>Dashboard</span></h1>
      </div>

      <nav className="nav" style={{marginTop:12}}>
        <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Full Dashboard</Link>
        <Link to="/real-time" className={isActive('/real-time') ? 'active' : ''}>Real-Time</Link>
        <Link to="/historical" className={isActive('/historical') ? 'active' : ''}>Historical</Link>
        <Link to="/analytics" className={isActive('/analytics') ? 'active' : ''}>Analytics</Link>
        <Link to="/settings" className={isActive('/settings') ? 'active' : ''}>Settings</Link>
      </nav>
    </div>
  );
}
