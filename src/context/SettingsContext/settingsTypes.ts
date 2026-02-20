export type BudgetCycleType = 'salary' | 'credit-card' | 'custom';

export interface BudgetCycle {
  id: string;
  name: string;
  type: BudgetCycleType;
  startDay: number;    // Day of month (1-31)
  endDay: number;      // Day of month (1-31)
  monthlyBudget: number;
  isActive: boolean;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  reminderTime: string;     // Format: "HH:mm" (24h)
  budgetAlerts: boolean;    // Alert at 80%, 100%
  weeklySummary: boolean;
}

export interface UserSettings {
  // Budget Cycles
  cycles: BudgetCycle[];
  activeCycleId: string | null;
  
  // Notifications
  notifications: NotificationSettings;
  
  // Display (migrated from existing contexts)
  theme: 'light' | 'dark';
  defaultCurrency: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  cycles: [
    {
      id: 'default-salary',
      name: 'Monthly Salary',
      type: 'salary',
      startDay: 1,
      endDay: 31,
      monthlyBudget: 0,
      isActive: true,
    },
  ],
  activeCycleId: 'default-salary',
  notifications: {
    dailyReminder: false,
    reminderTime: '20:00',
    budgetAlerts: true,
    weeklySummary: false,
  },
  theme: 'light',
  defaultCurrency: 'USD',
};

export interface SettingsContextType extends UserSettings {
  // Cycle Management
  addCycle: (cycle: Omit<BudgetCycle, 'id'>) => void;
  updateCycle: (id: string, updates: Partial<BudgetCycle>) => void;
  deleteCycle: (id: string) => void;
  setActiveCycle: (id: string) => void;
  getActiveCycle: () => BudgetCycle | null;
  
  // Notifications
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Display Settings
  setTheme: (theme: 'light' | 'dark') => void;
  setDefaultCurrency: (currency: string) => void;
  
  // Persistence
  isLoading: boolean;
  saveSettings: () => void;
}
