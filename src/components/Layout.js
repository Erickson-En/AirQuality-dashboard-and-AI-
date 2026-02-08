// src/components/Layout.js
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="app-root">
      <div className="sidebar">
        <Sidebar />
      </div>
      <div className="main">
        <Header />
        {children}
      </div>
    </div>
  );
}
