import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/useTheme';
import { useCurrency } from '@/context/useCurrency';
import { CURRENCIES, type CurrencyCode } from '@/types/currency';
import { formatCurrency } from '@/utils/formatCurrency';
import { 
  LogOut, 
  User, 
  Plus, 
  Trash2, 
  Edit2, 
  Moon, 
  Sun, 
  DollarSign,
  Calendar,
  Check
} from 'lucide-react';
import type { BudgetCycle, BudgetCycleType } from '@/context/SettingsContext';
import './Settings.css';

export const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    theme: settingsTheme, 
    setTheme,
    defaultCurrency,
    setDefaultCurrency,
    cycles,
    activeCycleId,
    addCycle,
    updateCycle,
    deleteCycle,
    setActiveCycle,
  } = useSettings();
  const { theme: currentTheme, toggleTheme } = useTheme();
  const { currency: currentCurrency, setCurrency } = useCurrency();
  
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [editingCycle, setEditingCycle] = useState<BudgetCycle | null>(null);
  const [cycleForm, setCycleForm] = useState({
    name: '',
    type: 'custom' as BudgetCycleType,
    startDay: 1,
    endDay: 31,
    monthlyBudget: '',
  });

  // Update cycle form currency display when global currency changes
  useEffect(() => {
    // This ensures the currency label in the form updates when currency changes
  }, [currentCurrency]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    // Only toggle if the theme is actually different
    if (currentTheme !== newTheme) {
      toggleTheme();
    }
    // Update settings for persistence
    setTheme(newTheme);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    // Validate that the currency is a valid CurrencyCode
    const validCurrencies = ['USD', 'CAD', 'EUR', 'TRY'];
    if (validCurrencies.includes(newCurrency)) {
      setDefaultCurrency(newCurrency);
      setCurrency(newCurrency as CurrencyCode);
    }
  };

  const handleAddCycle = () => {
    if (cycleForm.name && cycleForm.monthlyBudget) {
      addCycle({
        name: cycleForm.name,
        type: cycleForm.type,
        startDay: cycleForm.startDay,
        endDay: cycleForm.endDay,
        monthlyBudget: parseFloat(cycleForm.monthlyBudget),
        isActive: true,
      });
      setCycleForm({
        name: '',
        type: 'custom',
        startDay: 1,
        endDay: 31,
        monthlyBudget: '',
      });
      setShowAddCycle(false);
    }
  };

  const handleUpdateCycle = () => {
    if (editingCycle && cycleForm.name && cycleForm.monthlyBudget) {
      updateCycle(editingCycle.id, {
        name: cycleForm.name,
        type: cycleForm.type,
        startDay: cycleForm.startDay,
        endDay: cycleForm.endDay,
        monthlyBudget: parseFloat(cycleForm.monthlyBudget),
      });
      setEditingCycle(null);
      setCycleForm({
        name: '',
        type: 'custom',
        startDay: 1,
        endDay: 31,
        monthlyBudget: '',
      });
    }
  };

  const startEditCycle = (cycle: BudgetCycle) => {
    setEditingCycle(cycle);
    setCycleForm({
      name: cycle.name,
      type: cycle.type,
      startDay: cycle.startDay,
      endDay: cycle.endDay,
      monthlyBudget: cycle.monthlyBudget.toString(),
    });
    setShowAddCycle(true);
  };

  const getCycleTypeLabel = (type: BudgetCycleType) => {
    switch (type) {
      case 'salary': return 'Salary Cycle';
      case 'credit-card': return 'Credit Card';
      default: return 'Custom';
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        {/* User Profile Section */}
        <section className="settings-section">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={32} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
        </section>

        {/* Display Settings */}
        <section className="settings-section">
          <h2>Display</h2>
          
          {/* Theme Toggle */}
          <div className="settings-card">
            <div className="settings-card-header">
              <Moon size={20} className="settings-icon" />
              <div className="settings-card-title">
                <span>Theme</span>
                <small>Choose your preferred appearance</small>
              </div>
            </div>
            
            <div className="theme-toggle-group">
              <button
                className={`theme-option ${settingsTheme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <Sun size={18} />
                Light
              </button>
              <button
                className={`theme-option ${settingsTheme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon size={18} />
                Dark
              </button>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="settings-card">
            <div className="settings-card-header">
              <DollarSign size={20} className="settings-icon" />
              <div className="settings-card-title">
                <span>Default Currency</span>
                <small>Currency for displaying amounts</small>
              </div>
            </div>
            
            <select
              value={defaultCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="settings-select"
            >
              {Object.values(CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Budget Cycles */}
        <section className="settings-section">
          <div className="section-header-with-action">
            <h2>Budget Cycles</h2>
            <button 
              className="add-btn-small"
              onClick={() => {
                setEditingCycle(null);
                setCycleForm({
                  name: '',
                  type: 'custom',
                  startDay: 1,
                  endDay: 31,
                  monthlyBudget: '',
                });
                setShowAddCycle(true);
              }}
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {cycles.map((cycle) => (
            <div 
              key={cycle.id} 
              className={`cycle-card ${activeCycleId === cycle.id ? 'active' : ''}`}
              onClick={() => setActiveCycle(cycle.id)}
            >
              <div className="cycle-info">
                <div className="cycle-header">
                  <span className="cycle-name">{cycle.name}</span>
                  {activeCycleId === cycle.id && (
                    <span className="active-badge">
                      <Check size={12} /> Active
                    </span>
                  )}
                </div>
                <div className="cycle-details">
                  <span>{getCycleTypeLabel(cycle.type)}</span>
                  <span className="cycle-dates">
                    Day {cycle.startDay} - Day {cycle.endDay}
                  </span>
                  <span className="cycle-budget">
                    {formatCurrency(cycle.monthlyBudget, currentCurrency)}
                  </span>
                </div>
              </div>
              
              <div className="cycle-actions">
                <button
                  className="cycle-action-btn edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditCycle(cycle);
                  }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="cycle-action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCycle(cycle.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {cycles.length === 0 && (
            <div className="empty-cycles">
              <Calendar size={48} />
              <p>No budget cycles yet</p>
              <small>Add a cycle to track your spending periods</small>
            </div>
          )}
        </section>

        {/* Notifications - DISABLED */}
        {/*
        <section className="settings-section">
          <h2>Notifications</h2>
          
          <div className="settings-card">
            <div className="settings-card-header">
              <Bell size={20} className="settings-icon" />
              <div className="settings-card-title">
                <span>Daily Reminder</span>
                <small>Get reminded to log your expenses</small>
              </div>
            </div>
            
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.dailyReminder}
                onChange={(e) => updateNotificationSettings({ dailyReminder: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {notifications.dailyReminder && (
            <div className="settings-card sub-item">
              <div className="settings-card-header">
                <div className="settings-card-title">
                  <span>Reminder Time</span>
                  <small>When to send the daily reminder</small>
                </div>
              </div>
              
              <input
                type="time"
                value={notifications.reminderTime}
                onChange={(e) => updateNotificationSettings({ reminderTime: e.target.value })}
                className="time-input"
              />
            </div>
          )}

          <div className="settings-card">
            <div className="settings-card-header">
              <Bell size={20} className="settings-icon" />
              <div className="settings-card-title">
                <span>Budget Alerts</span>
                <small>Alert when approaching budget limit</small>
              </div>
            </div>
            
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.budgetAlerts}
                onChange={(e) => updateNotificationSettings({ budgetAlerts: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <Bell size={20} className="settings-icon" />
              <div className="settings-card-title">
                <span>Weekly Summary</span>
                <small>Receive weekly spending summary</small>
              </div>
            </div>
            
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.weeklySummary}
                onChange={(e) => updateNotificationSettings({ weeklySummary: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </section>
        */}

        {/* Account Section */}
        <section className="settings-section">
          <h2>Account</h2>
          
          <button 
            className="settings-item danger"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </section>
      </div>

      {/* Add/Edit Cycle Modal */}
      {showAddCycle && (
        <div className="cycle-modal-overlay">
          <div className="cycle-modal">
            <h3>{editingCycle ? 'Edit Cycle' : 'Add Budget Cycle'}</h3>
            
            <div className="form-group">
              <label>Cycle Name</label>
              <input
                type="text"
                value={cycleForm.name}
                onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                placeholder="e.g., Monthly Salary"
              />
            </div>

            <div className="form-group">
              <label>Cycle Type</label>
              <select
                value={cycleForm.type}
                onChange={(e) => setCycleForm({ ...cycleForm, type: e.target.value as BudgetCycleType })}
              >
                <option value="salary">Salary Cycle</option>
                <option value="credit-card">Credit Card</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={cycleForm.startDay}
                  onChange={(e) => setCycleForm({ ...cycleForm, startDay: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="form-group">
                <label>End Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={cycleForm.endDay}
                  onChange={(e) => setCycleForm({ ...cycleForm, endDay: parseInt(e.target.value) || 31 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Monthly Budget ({currentCurrency})</label>
              <input
                type="number"
                value={cycleForm.monthlyBudget}
                onChange={(e) => setCycleForm({ ...cycleForm, monthlyBudget: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowAddCycle(false);
                  setEditingCycle(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={editingCycle ? handleUpdateCycle : handleAddCycle}
                disabled={!cycleForm.name || !cycleForm.monthlyBudget}
              >
                {editingCycle ? 'Update' : 'Add'} Cycle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
