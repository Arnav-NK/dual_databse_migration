import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Header({ dbStatus, user, onLogout, onOpenAuth }) {
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
            title={`Mode: ${dbLabel} | Driver: ${dbStatus.driver || 'Active'} | Host: ${dbStatus.dbHost || 'Remote'}`}
          >
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
            <span>{isOnline ? dbLabel : 'Connecting DB...'}</span>
          </div>

          {/* User Auth Section */}
          {user ? (
            <div className="user-profile-badge">
              <div className="user-avatar" title={user.email}>
                <UserIcon size={14} />
                <span className="user-email-text">{user.email.split('@')[0]}</span>
              </div>
              <button
                type="button"
                className="logout-btn"
                onClick={onLogout}
                title="Log out of your account"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="login-trigger-btn"
              onClick={onOpenAuth}
            >
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
