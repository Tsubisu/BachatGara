import React from 'react';
import NavigationDrawer from './NavigationDrawer';

export default function PageWrapper({ children, theme, toggleTheme, balance, sidebarCollapsed, setSidebarCollapsed, onLogout, user }) {
  return (
    <div className={`layout-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <NavigationDrawer 
        theme={theme} 
        toggleTheme={toggleTheme} 
        balance={balance} 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onLogout={onLogout}
        user={user}
      />
      <main className="main-content-area">
        <div className="content-width-container">
          {children}
        </div>
      </main>
    </div>
  );
}
