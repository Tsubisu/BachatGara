import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, Palette, Landmark, Folder, Smartphone } from 'lucide-react';

export default function SettingsLayout({ children }) {
  const tabs = [
    { label: 'Profile Details', path: '/settings/profile', icon: User },
    { label: 'Theme & Accent', path: '/settings/theme', icon: Palette },
    { label: 'Bank Accounts', path: '/settings/accounts', icon: Landmark },
    { label: 'Categories', path: '/settings/categories', icon: Folder },
    { label: 'SMS Gateway', path: '/settings/gateway', icon: Smartphone }
  ];

  return (
    <div className="settings-layout-wrapper">

      <aside className="glass-card settings-submenu-card">
        <h3 className="settings-submenu-title">
          Settings
        </h3>
        <nav className="settings-submenu-nav">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="glass-card settings-view-panel animate-fade-in">
        {children}
      </div>
    </div>
  );
}
