import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TransactionForm } from '@/components/TransactionForm';
import { ConfirmModal } from '@/components/ConfirmModal';
import { storageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCurrency } from '@/context/useCurrency';
import { useExchangeRates } from '@/context/useExchangeRates';
import { convertAmount, calculateTotalInCurrency } from '@/utils/conversions';
import type { Transaction, CurrencyCode } from '@/types';
import './Dashboard.css';

export const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentDate] = useState(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { currency } = useCurrency();
  const { rates } = useExchangeRates();

  const loadTransactions = () => {
    const data = storageService.getTransactions();
    setTransactions(data);
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      storageService.deleteTransaction(transactionToDelete);
      loadTransactions();
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setTransactionToDelete(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCloseEditModal = () => {
    setEditingTransaction(null);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Calculate stats with currency conversion
  const stats = useMemo(() => {
    // Convert all amounts to selected currency
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
      dailyBudget: Math.max(0, (convertedIncome - convertedMandatory) / 30)
    };
  }, [transactions, currency, rates]);

  // Calculate spending breakdown by category for pie chart
  const spendingByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};
    
    expenses.forEach(t => {
      const convertedAmount = convertAmount(
        t.amount,
        (t.currency || 'USD') as CurrencyCode,
        currency,
        rates
      );
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + convertedAmount;
    });
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, currency, rates]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#10b981', '#64748b'];

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
            <h2>Spending by Category</h2>
            <p>Breakdown of your expenses</p>
          </div>
          <div className="chart-container">
            {spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {spendingByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, currency)}
                    contentStyle={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.75rem',
                      boxShadow: 'var(--shadow-lg)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No expenses yet</p>
                <span>Add expenses to see the breakdown</span>
              </div>
            )}
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
                recentTransactions.map(transaction => {
                const transactionCurrency = (transaction.currency || 'USD') as CurrencyCode;
                const convertedAmount = convertAmount(
                  transaction.amount, 
                  transactionCurrency, 
                  currency, 
                  rates
                );
                
                return (
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
                    <div className="amount-details">
                      <span className={transaction.type}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(convertedAmount, currency)}
                      </span>
                      <span className="original-amount">
                        {formatCurrency(transaction.amount, transactionCurrency)}
                      </span>
                    </div>
                    <div className="transaction-actions">
                      {transaction.expenseType && (
                        <span className={`expense-type ${transaction.expenseType}`}>
                          {transaction.expenseType}
                        </span>
                      )}
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEditTransaction(transaction)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteClick(transaction.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionForm
          onTransactionAdded={loadTransactions}
          editingTransaction={editingTransaction}
          onCancelEdit={handleCloseEditModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
