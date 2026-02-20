import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, getDay, isToday, isSameMonth, isSameDay } from 'date-fns';
import { storageService } from '@/services/storage';
import { generateCalendarDays } from '@/utils/calculations';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCurrency } from '@/context/useCurrency';
import { useExchangeRates } from '@/context/useExchangeRates';
import { convertAmount, calculateTotalInCurrency } from '@/utils/conversions';
import { TransactionForm } from '@/components/TransactionForm';
import type { Transaction, CurrencyCode } from '@/types';
import './Calendar.css';

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { currency } = useCurrency();
  const { rates } = useExchangeRates();

  const loadTransactions = async () => {
    const data = await storageService.getTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const stats = useMemo(() => {
    const convertedIncome = calculateTotalInCurrency(
      transactions.filter(t => t.type === 'income').map(t => ({ amount: t.amount, currency: (t.currency || 'USD') as CurrencyCode })),
      currency,
      rates
    );
    
    const convertedExpense = calculateTotalInCurrency(
      transactions.filter(t => t.type === 'expense').map(t => ({ amount: t.amount, currency: (t.currency || 'USD') as CurrencyCode })),
      currency,
      rates
    );
    
    const convertedMandatory = calculateTotalInCurrency(
      transactions.filter(t => t.type === 'expense' && t.expenseType === 'mandatory').map(t => ({ amount: t.amount, currency: (t.currency || 'USD') as CurrencyCode })),
      currency,
      rates
    );
    
    return {
      totalIncome: convertedIncome,
      totalExpense: convertedExpense,
      moneySaved: convertedIncome - convertedExpense,
      dailyBudget: Math.max(0, (convertedIncome - convertedMandatory) / (new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()))
    };
  }, [transactions, currency, rates, currentDate]);

  const calendarDays = generateCalendarDays(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    transactions
  );

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const startDay = getDay(startOfMonth(currentDate));
  const emptyDays = Array(startDay).fill(null);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const selectedDayStats = selectedDay 
    ? calendarDays.find(d => isSameDay(d.date, selectedDay))?.stats
    : null;

  const getDayStatus = (day: typeof calendarDays[0]) => {
    if (!day.stats || day.stats.transactions.length === 0) return null;
    
    const expense = convertAmount(day.stats.expense, 'USD', currency, rates);
    const income = convertAmount(day.stats.income, 'USD', currency, rates);
    
    if (expense > stats.dailyBudget) return 'over-budget';
    if (income > expense) return 'profit';
    if (expense > 0) return 'expense';
    if (income > 0) return 'income';
    return null;
  };

  return (
    <div className="calendar-page">
      {/* Header */}
      <header className="calendar-header">
        <div className="calendar-title-section">
          <span className="calendar-label">Calendar</span>
          <div className="month-nav">
            <button 
              className="nav-arrow"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="month-year">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <button 
              className="nav-arrow"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        <button 
          className="add-btn"
          onClick={() => setFormOpen(true)}
          aria-label="Add transaction"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Calendar Grid */}
      <div className="calendar-wrapper">
        {/* Weekday Headers */}
        <div className="weekday-row">
          {weekDays.map(day => (
            <div key={day} className="weekday-cell">{day}</div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="days-grid">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="day-cell empty" />
          ))}
          
          {calendarDays.map((day) => {
            const isSelected = selectedDay && isSameDay(day.date, selectedDay);
            const isTodayDate = isToday(day.date);
            const isCurrentMonth = isSameMonth(day.date, currentDate);
            const status = getDayStatus(day);
            const hasTransactions = day.stats && day.stats.transactions.length > 0;
            
            return (
              <button
                key={day.date.toISOString()}
                className={`day-cell ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                onClick={() => setSelectedDay(day.date)}
                aria-label={format(day.date, 'MMMM do')}
                aria-pressed={!!isSelected}
              >
                <span className="day-number">{format(day.date, 'd')}</span>
                
                {hasTransactions && (
                  <div className="day-dots">
                    {status === 'over-budget' && (
                      <span className="dot over-budget-dot" />
                    )}
                    {status === 'profit' && (
                      <span className="dot profit-dot" />
                    )}
                    {(status === 'expense' || status === 'income') && (
                      <span className="dot expense-dot" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Budget Info */}
      <div className="budget-info-bar">
        <span className="budget-label">Daily Budget</span>
        <span className="budget-value">{formatCurrency(stats.dailyBudget, currency)}</span>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <>
          <div className="day-detail-backdrop" onClick={() => setSelectedDay(null)} />
          <div className="day-detail-panel">
            {/* Budget Status Header */}
            <div className={`budget-status-header ${
              !selectedDayStats || selectedDayStats.transactions.length === 0 
                ? 'neutral' 
                : selectedDayStats.expense > stats.dailyBudget 
                  ? 'over-budget' 
                  : 'under-budget'
            }`}>
              <div className="budget-status-content">
                <div className="budget-status-label">
                  {!selectedDayStats || selectedDayStats.transactions.length === 0 
                    ? 'No Activity' 
                    : selectedDayStats.expense > stats.dailyBudget 
                      ? 'Over Budget' 
                      : 'Money Saved'}
                </div>
                <div className="budget-status-amount">
                  {!selectedDayStats || selectedDayStats.transactions.length === 0 
                    ? formatCurrency(0, currency)
                    : selectedDayStats.expense > stats.dailyBudget 
                      ? formatCurrency(convertAmount(selectedDayStats.expense, 'USD', currency, rates) - stats.dailyBudget, currency)
                      : formatCurrency(stats.dailyBudget - convertAmount(selectedDayStats.expense, 'USD', currency, rates), currency)}
                </div>
              </div>
            </div>

            <div className="detail-header">
              <span className="detail-date">{format(selectedDay, 'EEEE, MMMM do')}</span>
              <button 
                className="close-detail"
                onClick={() => setSelectedDay(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            {/* Daily Budget Summary */}
            <div className="daily-budget-summary">
              <div className="budget-summary-item">
                <span className="budget-summary-label">Daily Budget</span>
                <span className="budget-summary-value">{formatCurrency(stats.dailyBudget, currency)}</span>
              </div>
              <div className="budget-summary-item">
                <span className="budget-summary-label">Total Spent</span>
                <span className="budget-summary-value spent">
                  {selectedDayStats 
                    ? formatCurrency(convertAmount(selectedDayStats.expense, 'USD', currency, rates), currency)
                    : formatCurrency(0, currency)}
                </span>
              </div>
            </div>
            
            {selectedDayStats && selectedDayStats.transactions.length > 0 ? (
              <div className="detail-transactions">
                {selectedDayStats.transactions.map(t => (
                  <div key={t.id} className={`detail-item ${t.type}`}>
                    <div className="detail-left">
                      <span className="detail-category">{t.category}</span>
                      {t.notes && <span className="detail-notes">{t.notes}</span>}
                    </div>
                    <span className={`detail-amount ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(convertAmount(t.amount, (t.currency || 'USD') as CurrencyCode, currency, rates), currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="detail-empty">
                <p>No transactions for this day</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Transaction Modal */}
      <TransactionForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onTransactionAdded={() => {
          loadTransactions();
          setFormOpen(false);
        }}
      />
    </div>
  );
};
