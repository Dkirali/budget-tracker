import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { TransactionForm } from '@/components/TransactionForm';
import { storageService } from '@/services/storage';
import { calculateDashboardStats, calculateDailyStats } from '@/utils/calculations';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCurrency } from '@/context/useCurrency';
import type { Transaction } from '@/types';
import './Dashboard.css';

export const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentDate] = useState(new Date());
  const { currency } = useCurrency();

  const loadTransactions = () => {
    const data = storageService.getTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const stats = useMemo(() => 
    calculateDashboardStats(transactions, currentDate),
    [transactions, currentDate]
  );

  const chartData = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dailyStats = calculateDailyStats(transactions, day);
      return {
        date: format(day, 'MMM dd'),
        fullDate: format(day, 'yyyy-MM-dd'),
        income: dailyStats.income,
        expense: dailyStats.expense,
        balance: dailyStats.income - dailyStats.expense
      };
    });
  }, [transactions, currentDate]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="current-month">
            <Calendar size={14} />
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>
        <TransactionForm onTransactionAdded={loadTransactions} />
      </header>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">{formatCurrency(stats.totalIncome, currency)}</span>
            <span className="stat-trend positive">
              <ArrowUpRight size={14} />
              This month
            </span>
          </div>
        </div>

        <div className="stat-card expense">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Expense</span>
            <span className="stat-value">{formatCurrency(stats.totalExpense, currency)}</span>
            <span className="stat-trend negative">
              <ArrowDownRight size={14} />
              This month
            </span>
          </div>
        </div>

        <div className="stat-card saved">
          <div className="stat-icon">
            <PiggyBank size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Money Saved</span>
            <span className="stat-value">{formatCurrency(stats.moneySaved, currency)}</span>
            <span className="stat-trend neutral">
              Income - Expense
            </span>
          </div>
        </div>

        <div className="stat-card daily-budget">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Daily Budget</span>
            <span className="stat-value">{formatCurrency(stats.dailyBudget, currency)}</span>
            <span className="stat-trend info">
              Per day available
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <div className="section-header">
            <h2>Income vs Expense</h2>
            <p>Daily breakdown for {format(currentDate, 'MMMM yyyy')}</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
                  name="Expense"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="recent-transactions">
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <p>Last 5 transactions</p>
          </div>
          <div className="transactions-list">
            {recentTransactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions yet</p>
                <span>Add your first transaction to get started</span>
              </div>
            ) : (
              recentTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className={`transaction-item ${transaction.type}`}
                >
                  <div className="transaction-info">
                    <span className="transaction-category">
                      {transaction.category}
                    </span>
                    {transaction.notes && (
                      <span className="transaction-notes">{transaction.notes}</span>
                    )}
                    <span className="transaction-date">
                      {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    <span className={transaction.type}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount, currency)}
                    </span>
                    {transaction.expenseType && (
                      <span className={`expense-type ${transaction.expenseType}`}>
                        {transaction.expenseType}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
