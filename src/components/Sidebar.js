import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaClock, FaChartLine, FaRobot, FaCog, FaTachometerAlt } from 'react-icons/fa'; // icons

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { path: '/dashboard', label: 'Full Dashboard', icon: <FaTachometerAlt /> },
    { path: '/real-time', label: 'Real-Time Data', icon: <FaClock /> },
    { path: '/historical', label: 'Historical Data', icon: <FaChartLine /> },
    { path: '/analytics', label: 'Analytics', icon: <FaRobot /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },
    
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Air Quality</h2>
      </div>
      <ul className="sidebar-links">
        {links.map((link) => (
          <li key={link.path} className={location.pathname.toLowerCase() === link.path.toLowerCase() ? 'active' : ''}>
            <Link to={link.path}>
              <span className="icon">{link.icon}</span>
              <span className="label">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
