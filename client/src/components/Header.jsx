import React from 'react';
import { CheckSquare, Moon, Sun, Database } from 'lucide-react';

export default function Header({ theme, toggleTheme, dbStatus }) {
  const isOnline = dbStatus.status === 'Connected';
  const dbLabel = dbStatus.dbType || (dbStatus.useSQL ? 'SQL Database' : 'MongoDB (NoSQL)');

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-section">
          <div className="logo-badge">
            <CheckSquare size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="app-title">MERN Todo</h1>
          </div>
        </div>

        <div className="header-actions">
          {/* Active Database Badge */}
          <div
            className="status-badge"
            title={`Mode: ${dbLabel} | Driver: ${dbStatus.driver || 'Active'} | Host: ${dbStatus.dbHost || 'Local'}`}
          >
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span>{isOnline ? `${dbLabel}` : 'Connecting DB...'}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
