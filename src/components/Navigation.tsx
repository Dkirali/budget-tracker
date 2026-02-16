import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/useTheme';
import './Navigation.css';

export const Navigation = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Wallet size={28} className="nav-logo-icon" />
        <span className="nav-logo-text">BudgetTracker</span>
      </div>
      
      <div className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/calendar" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Calendar size={20} />
          <span>Calendar</span>
        </NavLink>

        <button 
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </nav>
  );
};
