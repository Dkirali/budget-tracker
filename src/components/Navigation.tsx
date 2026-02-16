import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, Sun, Moon, DollarSign } from 'lucide-react';
import { useTheme } from '@/context/useTheme';
import { useCurrency } from '@/context/useCurrency';
import { CURRENCIES } from '@/types/currency';
import './Navigation.css';

export const Navigation = () => {
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

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

        <div className="currency-selector">
          <DollarSign size={16} className="currency-icon" />
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value as typeof currency)}
            className="currency-select"
          >
            {Object.values(CURRENCIES).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.flag} {curr.code}
              </option>
            ))}
          </select>
        </div>

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
