import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet } from 'lucide-react';
import './Navigation.css';

export const Navigation = () => {
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
      </div>
    </nav>
  );
};
