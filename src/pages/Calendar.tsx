import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, ShoppingBag, Briefcase } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, getDay } from 'date-fns';
import { storageService } from '@/services/storage';
import { generateCalendarDays, calculateDashboardStats, formatCurrency } from '@/utils/calculations';
import { TransactionForm } from '@/components/TransactionForm';
import type { Transaction } from '@/types';
import './Calendar.css';

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const loadTransactions = () => {
    const data = storageService.getTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const stats = calculateDashboardStats(transactions, currentDate);
  const calendarDays = generateCalendarDays(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    transactions
  );

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const startDay = getDay(startOfMonth(currentDate));
  const emptyDays = Array(startDay).fill(null);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const selectedDayStats = selectedDay 
    ? calendarDays.find(d => d.date.toDateString() === selectedDay.toDateString())?.stats
    : null;

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <div className="calendar-title">
          <h1>Calendar</h1>
          <div className="month-navigation">
            <button onClick={handlePrevMonth} className="nav-btn">
              <ChevronLeft size={20} />
            </button>
            <span className="current-month">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={handleNextMonth} className="nav-btn">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="calendar-summary">
          <div className="summary-item">
            <span className="summary-label">Daily Budget</span>
            <span className="summary-value budget">{formatCurrency(stats.dailyBudget)}</span>
          </div>
          <TransactionForm onTransactionAdded={loadTransactions} />
        </div>
      </header>

      <div className="calendar-content">
        <div className="calendar-grid-container">
          <div className="weekday-headers">
            {weekDays.map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
          </div>
          
          <div className="calendar-grid">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="calendar-day empty" />
            ))}
            
            {calendarDays.map((day) => {
              const isOverBudget = day.stats && day.stats.expense > stats.dailyBudget;
              const isSelected = selectedDay?.toDateString() === day.date.toDateString();
              
              return (
                <div
                  key={day.date.toISOString()}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isOverBudget ? 'over-budget' : ''}`}
                  onClick={() => setSelectedDay(day.date)}
                >
                  <span className="day-number">{format(day.date, 'd')}</span>
                  
                  {day.stats && day.stats.transactions.length > 0 && (
                    <div className="day-stats">
                      {day.stats.income > 0 && (
                        <span className="day-income">+{formatCurrency(day.stats.income)}</span>
                      )}
                      {day.stats.expense > 0 && (
                        <span className="day-expense">
                          {isOverBudget && <AlertCircle size={10} className="over-budget-icon" />}
                          -{formatCurrency(day.stats.expense)}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {day.stats && day.stats.transactions.length > 0 && (
                    <div className="day-indicators">
                      {day.stats.mandatoryExpense > 0 && (
                        <span className="indicator mandatory" title="Mandatory expense" />
                      )}
                      {day.stats.leisureExpense > 0 && (
                        <span className="indicator leisure" title="Leisure expense" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="day-details">
          <div className="section-header">
            <h2>
              {selectedDay 
                ? format(selectedDay, 'EEEE, MMMM do') 
                : 'Select a day'}
            </h2>
            <p>{selectedDay ? 'Daily transactions' : 'Click a calendar day to view details'}</p>
          </div>

          {selectedDayStats && selectedDayStats.transactions.length > 0 ? (
            <div className="day-transactions">
              <div className="day-summary-bar">
                <div className="summary-stat">
                  <span className="label">Income</span>
                  <span className="value income">+{formatCurrency(selectedDayStats.income)}</span>
                </div>
                <div className="summary-stat">
                  <span className="label">Expense</span>
                  <span className="value expense">-{formatCurrency(selectedDayStats.expense)}</span>
                </div>
                <div className="summary-stat">
                  <span className="label">Net</span>
                  <span className={`value ${selectedDayStats.income - selectedDayStats.expense >= 0 ? 'income' : 'expense'}`}>
                    {selectedDayStats.income - selectedDayStats.expense >= 0 ? '+' : ''}
                    {formatCurrency(selectedDayStats.income - selectedDayStats.expense)}
                  </span>
                </div>
                {selectedDayStats.expense > stats.dailyBudget && (
                  <div className="budget-alert">
                    <AlertCircle size={14} />
                    Exceeded budget by {formatCurrency(selectedDayStats.expense - stats.dailyBudget)}
                  </div>
                )}
              </div>

              <div className="transactions-list">
                {selectedDayStats.transactions.map(transaction => (
                  <div 
                    key={transaction.id} 
                    className={`day-transaction-item ${transaction.type}`}
                  >
                    <div className="transaction-icon">
                      {transaction.type === 'income' ? (
                        <Briefcase size={18} />
                      ) : (
                        <ShoppingBag size={18} />
                      )}
                    </div>
                    <div className="transaction-details">
                      <span className="transaction-category">{transaction.category}</span>
                      {transaction.notes && (
                        <span className="transaction-notes">{transaction.notes}</span>
                      )}
                      {transaction.expenseType && (
                        <span className={`transaction-type ${transaction.expenseType}`}>
                          {transaction.expenseType}
                          {transaction.isRecurring && ' • Recurring'}
                        </span>
                      )}
                    </div>
                    <span className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedDay ? (
            <div className="empty-state">
              <p>No transactions on this day</p>
              <span>Add a transaction to track your spending</span>
            </div>
          ) : (
            <div className="empty-state">
              <p>Select a day to view transactions</p>
            </div>
          )}

          <div className="legend">
            <div className="legend-item">
              <span className="legend-indicator mandatory" />
              <span>Mandatory Expense</span>
            </div>
            <div className="legend-item">
              <span className="legend-indicator leisure" />
              <span>Leisure Expense</span>
            </div>
            <div className="legend-item">
              <span className="legend-indicator over-budget" />
              <span>Over Budget</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
