import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Track sidebar visibility

  // Apply theme to the document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev); // Toggle sidebar visibility

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {isSidebarOpen && <Sidebar />}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Header */}
        <Header
          toggleTheme={toggleTheme}
          theme={theme}
          toggleSidebar={toggleSidebar} // Pass toggle function
        />

        {/* Page Content */}
        <div
          className="main-content"
          style={{
            flex: 1,
            marginTop: '20px',
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
