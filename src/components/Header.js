import React from 'react';
import { FaSun, FaMoon, FaBars } from 'react-icons/fa';

const Header = ({ toggleTheme, theme, toggleSidebar }) => {
  return (
    <header className="header">
      <div className="header-left">
        {/* Hamburger Menu */}
        <button
          className="hamburger"
          onClick={toggleSidebar}
        >
          <FaBars className="h-6 w-6" />
        </button>

        <h1>Air Quality Dashboard</h1>
      </div>

      <div className="header-right">
        <div className="user-profile">
          
          <span className="username">Admin</span>
        </div>

        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </header>
  );
};

export default Header;
