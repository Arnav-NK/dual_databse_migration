import React from 'react';

export default function Header({ dbStatus }) {
  const isOnline = dbStatus.status === 'Connected';
  const dbLabel = dbStatus.dbType || (dbStatus.useSQL ? 'SQL Database' : 'MongoDB (NoSQL)');

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-section">
          <h1 className="app-title">Todo</h1>
        </div>

        <div className="header-actions">
          {/* Active Database Badge */}
          <div
            className="status-badge"
            title={`Mode: ${dbLabel} | Driver: ${dbStatus.driver || 'Active'} | Host: ${dbStatus.dbHost || 'Local'}`}
          >
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span>{isOnline ? dbLabel : 'Connecting DB...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
