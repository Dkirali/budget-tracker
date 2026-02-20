import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Calendar, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import './BottomNav.css';

export const BottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Don't show bottom nav on login page or when not authenticated
  if (!isAuthenticated || location.pathname === '/login') {
    return null;
  }
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <NavLink 
        to="/" 
        className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}
        aria-current={isActive('/') ? 'page' : undefined}
      >
        <LayoutDashboard size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
        <span className="bottom-nav-label">Dashboard</span>
      </NavLink>
      
      <NavLink 
        to="/transactions" 
        className={`bottom-nav-item ${isActive('/transactions') ? 'active' : ''}`}
        aria-current={isActive('/transactions') ? 'page' : undefined}
      >
        <Receipt size={24} strokeWidth={isActive('/transactions') ? 2.5 : 2} />
        <span className="bottom-nav-label">Transactions</span>
      </NavLink>
      
      <NavLink 
        to="/calendar" 
        className={`bottom-nav-item ${isActive('/calendar') ? 'active' : ''}`}
        aria-current={isActive('/calendar') ? 'page' : undefined}
      >
        <Calendar size={24} strokeWidth={isActive('/calendar') ? 2.5 : 2} />
        <span className="bottom-nav-label">Calendar</span>
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={`bottom-nav-item ${isActive('/settings') ? 'active' : ''}`}
        aria-current={isActive('/settings') ? 'page' : undefined}
      >
        <Settings size={24} strokeWidth={isActive('/settings') ? 2.5 : 2} />
        <span className="bottom-nav-label">Settings</span>
      </NavLink>
    </nav>
  );
};
