export type TransactionType = 'income' | 'expense';

export type ExpenseType = 'mandatory' | 'leisure';

export type IncomeCategory = 'salary' | 'freelance' | 'bonus' | 'other';

export type ExpenseCategory = 
  | 'housing' 
  | 'food' 
  | 'business' 
  | 'transportation' 
  | 'utilities' 
  | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  expenseType?: ExpenseType;
  isRecurring?: boolean;
}

export interface TransactionFormData {
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory;
  amount: string;
  date: string;
  notes: string;
  expenseType: ExpenseType;
  isRecurring: boolean;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  moneySaved: number;
  dailyBudget: number;
}

export interface DailyStats {
  date: string;
  income: number;
  expense: number;
  mandatoryExpense: number;
  leisureExpense: number;
  transactions: Transaction[];
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  stats: DailyStats | null;
}

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'other', label: 'Other' }
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'housing', label: 'Housing' },
  { value: 'food', label: 'Food' },
  { value: 'business', label: 'Business' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' }
];

// Re-export currency types
export * from './currency';
