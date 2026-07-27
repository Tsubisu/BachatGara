import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  Target,
  PiggyBank,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

export default function NavigationDrawer({ theme, toggleTheme, balance = 0, sidebarCollapsed, setSidebarCollapsed, onLogout, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = user?.profile_name || user?.name || 'User';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'BG';

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Ledger & SMS', path: '/transactions', icon: ReceiptText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Budgets', path: '/budgets', icon: Target },
    { label: 'Savings Goals', path: '/savings', icon: PiggyBank },
    { label: 'Subscriptions', path: '/subscriptions', icon: Calendar },
    { label: 'Settings', path: '/settings', icon: SettingsIcon }
  ];

  return (
    <aside className={`drawer-aside ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="drawer-toggle-btn"
        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="drawer-profile">
        <div className="avatar-circle" style={{ overflow: 'hidden' }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        {!sidebarCollapsed && (
          <>
            <h2 className="profile-name">{displayName}</h2>
            {displayEmail && <span className="profile-email">{displayEmail}</span>}
            <div className="profile-balance-badge">
              Net: <strong>Rs. {(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </div>
          </>
        )}
      </div>

      <ul className="drawer-menu">
        {navItems.map(item => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <li key={item.path} className={`drawer-menu-item ${isActive ? 'active' : ''}`}>
              <Link to={item.path} title={item.label}>
                <Icon size={20} />
                <span className="label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="drawer-footer">
        <div style={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
          {!sidebarCollapsed && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Dark Mode</span>}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-accent)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <button
          onClick={onLogout}
          className="btn-primary"
          style={{ width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', cursor: 'pointer' }}
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
