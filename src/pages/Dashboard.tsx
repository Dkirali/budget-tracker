import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TransactionForm } from '@/components/TransactionForm';
import { ConfirmModal } from '@/components/ConfirmModal';
import { storageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCurrency } from '@/context/useCurrency';
import { useExchangeRates } from '@/context/useExchangeRates';
import { useSettings } from '@/context/SettingsContext';
import { convertAmount, calculateTotalInCurrency } from '@/utils/conversions';
import type { Transaction, CurrencyCode } from '@/types';
import './Dashboard.css';

export const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPieSlice, setSelectedPieSlice] = useState<{name: string; value: number; color: string; percent: number} | null>(null);
  const { currency } = useCurrency();
  const { rates } = useExchangeRates();
  const { getActiveCycle } = useSettings();

  // Initial load - sadece mount'ta çalışır
  useEffect(() => {
    const loadInitialData = async () => {
      const data = await storageService.getTransactions();
      setTransactions(data);
    };
    loadInitialData();
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (transactionToDelete) {
      // 1. UI'dan hemen kaldır (optimistic delete)
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      // 2. Modal'ı kapat
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      // 3. Server'dan sil (background'da, async)
      await storageService.deleteTransaction(transactionToDelete);
    }
  }, [transactionToDelete]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setTransactionToDelete(null);
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditingTransaction(null);
    setFormOpen(false);
  }, []);

  const handleTransactionSubmit = useCallback((transaction: Transaction) => {
    // Optimistic update: Direkt state'e ekle/güncelle, server cevabını bekleme
    setTransactions(prev => {
      const existingIndex = prev.findIndex(t => t.id === transaction.id);
      if (existingIndex >= 0) {
        // Edit: Mevcut transaction'ı güncelle
        const updated = [...prev];
        updated[existingIndex] = transaction;
        return updated;
      } else {
        // Add: Yeni transaction'ı başa ekle
        return [transaction, ...prev];
      }
    });
    // Modal'ı kapat
    setFormOpen(false);
    setEditingTransaction(null);
  }, []);

  const activeCycle = getActiveCycle();

  // Stats hesaplamaları - transactions değiştiğinde otomatik güncellenir
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

    let daysInCycle = 30;
    if (activeCycle) {
      if (activeCycle.startDay <= activeCycle.endDay) {
        daysInCycle = activeCycle.endDay - activeCycle.startDay + 1;
      } else {
        daysInCycle = (31 - activeCycle.startDay + 1) + activeCycle.endDay;
      }
    }

    const monthlyBudget = activeCycle?.monthlyBudget || Math.max(0, convertedIncome - convertedMandatory);
    
    return {
      totalIncome: convertedIncome,
      totalExpense: convertedExpense,
      moneySaved: convertedIncome - convertedExpense,
      dailyBudget: monthlyBudget / daysInCycle,
      monthlyBudget,
      daysInCycle,
      activeCycleName: activeCycle?.name || 'Monthly'
    };
  }, [transactions, currency, rates, activeCycle]);

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
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }))
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
            {stats.activeCycleName}
          </p>
        </div>
        <button 
          className="add-transaction-btn desktop-only"
          onClick={() => setFormOpen(true)}
        >
          Add Transaction
        </button>
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
              {activeCycle 
                ? `Day ${activeCycle.startDay}-${activeCycle.endDay}`
                : 'Per day available'
              }
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
                    onClick={(_, index) => {
                      const item = spendingByCategory[index];
                      const total = spendingByCategory.reduce((sum, item) => sum + item.value, 0);
                      setSelectedPieSlice({
                        name: item.name,
                        value: item.value,
                        color: COLORS[index % COLORS.length],
                        percent: (item.value / total) * 100
                      });
                    }}
                    style={{ cursor: 'pointer' }}
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

      <TransactionForm
        isOpen={formOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleTransactionSubmit}
        editingTransaction={editingTransaction}
      />

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

      {selectedPieSlice && (
        <div className="pie-detail-modal-overlay" onClick={() => setSelectedPieSlice(null)}>
          <div className="pie-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="pie-detail-close" 
              onClick={() => setSelectedPieSlice(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="pie-detail-content">
              <div 
                className="pie-detail-color" 
                style={{ backgroundColor: selectedPieSlice.color }}
              />
              <h3 className="pie-detail-title">{selectedPieSlice.name}</h3>
              <div className="pie-detail-amount">
                {formatCurrency(selectedPieSlice.value, currency)}
              </div>
              <div className="pie-detail-percent">
                {selectedPieSlice.percent.toFixed(1)}% of total spending
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        className="fab-add mobile-only"
        onClick={() => setFormOpen(true)}
        aria-label="Add transaction"
      >
        <TrendingUp size={24} />
      </button>
    </div>
  );
};