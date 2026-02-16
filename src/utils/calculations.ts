import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth,
  getDaysInMonth
} from 'date-fns';
import type { Transaction, DashboardStats, DailyStats, CalendarDay } from '@/types';

export const calculateDashboardStats = (
  transactions: Transaction[],
  currentDate: Date = new Date()
): DashboardStats => {
  const currentMonthStr = format(currentDate, 'yyyy-MM');
  
  const monthTransactions = transactions.filter(t => 
    t.date.startsWith(currentMonthStr)
  );

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMandatoryExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.expenseType === 'mandatory')
    .reduce((sum, t) => sum + t.amount, 0);

  const daysInMonth = getDaysInMonth(currentDate);
  const dailyBudget = daysInMonth > 0 
    ? (totalIncome - totalMandatoryExpense) / daysInMonth 
    : 0;

  return {
    totalIncome,
    totalExpense,
    moneySaved: totalIncome - totalExpense,
    dailyBudget: Math.max(0, dailyBudget)
  };
};

export const calculateDailyStats = (
  transactions: Transaction[],
  date: Date
): DailyStats => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayTransactions = transactions.filter(t => t.date === dateStr);

  const income = dayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = dayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const mandatoryExpense = dayTransactions
    .filter(t => t.type === 'expense' && t.expenseType === 'mandatory')
    .reduce((sum, t) => sum + t.amount, 0);

  const leisureExpense = dayTransactions
    .filter(t => t.type === 'expense' && t.expenseType === 'leisure')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    date: dateStr,
    income,
    expense,
    mandatoryExpense,
    leisureExpense,
    transactions: dayTransactions
  };
};

export const generateCalendarDays = (
  year: number,
  month: number,
  transactions: Transaction[]
): CalendarDay[] => {
  const date = new Date(year, month, 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  const days = eachDayOfInterval({ start, end });
  
  return days.map(day => ({
    date: day,
    isCurrentMonth: isSameMonth(day, date),
    stats: calculateDailyStats(transactions, day)
  }));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
