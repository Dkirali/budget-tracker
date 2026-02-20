import { useState, useEffect, useCallback, useMemo } from 'react';
import { SettingsContext } from './SettingsContextDefinition';
import { useAuth } from '@/context/AuthContext';
import { useTheme as useExistingTheme } from '@/context/useTheme';
import { useCurrency as useExistingCurrency } from '@/context/useCurrency';
import { uuidv4 } from '@/utils/uuid';
import type { UserSettings, BudgetCycle, NotificationSettings } from './settingsTypes';
import { DEFAULT_SETTINGS } from './settingsTypes';

const getStorageKey = (userId: string) => `budget-tracker-settings-${userId}`;

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { theme: existingTheme, setTheme: setExistingTheme } = useExistingTheme();
  const { currency: existingCurrency, setCurrency: setExistingCurrency } = useExistingCurrency();
  
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

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
        
        // Sync with existing contexts
        if (parsed.theme) {
          setExistingTheme(parsed.theme);
        }
        if (parsed.defaultCurrency) {
          setExistingCurrency(parsed.defaultCurrency as typeof existingCurrency);
        }
      } else {
        // New user - use defaults but sync with existing contexts
        setSettings(prev => ({
          ...prev,
          theme: existingTheme,
          defaultCurrency: existingCurrency,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, existingTheme, existingCurrency, setExistingTheme, setExistingCurrency]);

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

  // Notification Settings
  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...newSettings },
    }));
  }, []);

  // Display Settings
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
    setExistingTheme(theme);
  }, [setExistingTheme]);

  const setDefaultCurrency = useCallback((currency: string) => {
    setSettings(prev => ({ ...prev, defaultCurrency: currency }));
    setExistingCurrency(currency as typeof existingCurrency);
  }, [setExistingCurrency, existingCurrency]);

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
