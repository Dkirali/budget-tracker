import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SettingsContext } from './SettingsContextDefinition';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/useCurrency';
import { uuidv4 } from '@/utils/uuid';
import type { UserSettings, BudgetCycle, NotificationSettings } from './settingsTypes';
import { DEFAULT_SETTINGS } from './settingsTypes';

const getStorageKey = (userId: string) => `budget-tracker-settings-${userId}`;

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { currency: globalCurrency, setCurrency: setGlobalCurrency } = useCurrency();
  
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const isUpdatingFromGlobal = useRef(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    try {
      const storageKey = getStorageKey(user.id);
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          // Ensure arrays and objects are properly merged
          cycles: parsed.cycles || DEFAULT_SETTINGS.cycles,
          notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
        });
      } else {
        // New user - use defaults
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Save settings to localStorage
  const saveSettings = useCallback(() => {
    if (!user) return;
    
    try {
      const storageKey = getStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings, user]);

  // Auto-save when settings change
  useEffect(() => {
    if (!isLoading && user) {
      saveSettings();
    }
  }, [settings, isLoading, user, saveSettings]);

  // Sync currency from CurrencyContext (when changed from header/navigation)
  useEffect(() => {
    if (!isLoading && globalCurrency && globalCurrency !== settings.defaultCurrency) {
      isUpdatingFromGlobal.current = true;
      setSettings(prev => ({ ...prev, defaultCurrency: globalCurrency }));
      // Reset flag after a short delay
      setTimeout(() => {
        isUpdatingFromGlobal.current = false;
      }, 0);
    }
  }, [globalCurrency, isLoading, settings.defaultCurrency]);

  // Sync currency from SettingsContext to CurrencyContext (when changed from Settings page)
  useEffect(() => {
    if (!isLoading && !isUpdatingFromGlobal.current && settings.defaultCurrency && settings.defaultCurrency !== globalCurrency) {
      setGlobalCurrency(settings.defaultCurrency as typeof globalCurrency);
    }
  }, [settings.defaultCurrency, isLoading, globalCurrency, setGlobalCurrency]);

  // Cycle Management
  const addCycle = useCallback((cycle: Omit<BudgetCycle, 'id'>) => {
    const newCycle: BudgetCycle = {
      ...cycle,
      id: uuidv4(),
    };
    
    setSettings(prev => ({
      ...prev,
      cycles: [...prev.cycles, newCycle],
      // If this is the first cycle, make it active
      activeCycleId: prev.cycles.length === 0 ? newCycle.id : prev.activeCycleId,
    }));
  }, []);

  const updateCycle = useCallback((id: string, updates: Partial<BudgetCycle>) => {
    setSettings(prev => ({
      ...prev,
      cycles: prev.cycles.map(cycle =>
        cycle.id === id ? { ...cycle, ...updates } : cycle
      ),
    }));
  }, []);

  const deleteCycle = useCallback((id: string) => {
    setSettings(prev => {
      const filtered = prev.cycles.filter(cycle => cycle.id !== id);
      return {
        ...prev,
        cycles: filtered,
        // If we deleted the active cycle, set the first remaining one as active
        activeCycleId: prev.activeCycleId === id 
          ? (filtered.length > 0 ? filtered[0].id : null)
          : prev.activeCycleId,
      };
    });
  }, []);

  const setActiveCycle = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      activeCycleId: id,
    }));
  }, []);

  const getActiveCycle = useCallback((): BudgetCycle | null => {
    if (!settings.activeCycleId) return null;
    return settings.cycles.find(cycle => cycle.id === settings.activeCycleId) || null;
  }, [settings.activeCycleId, settings.cycles]);

  // Notification Settings - DISABLED (no-op functions)
  const updateNotificationSettings = useCallback((_newSettings: Partial<NotificationSettings>) => {
    // Notifications are disabled - do nothing
    console.log('Notifications are disabled');
  }, []);

  // Display Settings - These just update the settings state
  // The actual theme/currency switching is handled by their respective contexts
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  const setDefaultCurrency = useCallback((currency: string) => {
    setSettings(prev => ({ ...prev, defaultCurrency: currency }));
  }, []);

  const contextValue = useMemo(
    () => ({
      ...settings,
      isLoading,
      addCycle,
      updateCycle,
      deleteCycle,
      setActiveCycle,
      getActiveCycle,
      updateNotificationSettings,
      setTheme,
      setDefaultCurrency,
      saveSettings,
    }),
    [
      settings,
      isLoading,
      addCycle,
      updateCycle,
      deleteCycle,
      setActiveCycle,
      getActiveCycle,
      updateNotificationSettings,
      setTheme,
      setDefaultCurrency,
      saveSettings,
    ]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
