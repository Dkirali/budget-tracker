import { useState, useEffect, useMemo } from 'react';
import { Receipt, Search, Filter, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { storageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCurrency } from '@/context/useCurrency';
import { useExchangeRates } from '@/context/useExchangeRates';
import { convertAmount } from '@/utils/conversions';
import { TransactionForm } from '@/components/TransactionForm';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { Transaction, CurrencyCode } from '@/types';
import './Transactions.css';

export const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { currency } = useCurrency();
  const { rates } = useExchangeRates();

  const loadTransactions = async () => {
    const data = await storageService.getTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      await storageService.deleteTransaction(transactionToDelete);
      await loadTransactions();
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
    setShowAddModal(false);
  };

  const handleCloseEditModal = () => {
    setEditingTransaction(null);
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const searchLower = searchQuery.toLowerCase();
        return (
          t.category.toLowerCase().includes(searchLower) ||
          (t.notes?.toLowerCase() || '').includes(searchLower) ||
          t.amount.toString().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      const date = t.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredTransactions]);

  return (
    <div className="transactions-page">
      <header className="transactions-header">
        <div className="header-top">
          <div>
            <h1>Transactions</h1>
            <p className="transaction-count">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button 
            className="fab-add"
            onClick={() => setShowAddModal(true)}
            aria-label="Add transaction"
          >
            <Plus size={24} />
          </button>
        </div>
        
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="filter-btn" aria-label="Filter">
            <Filter size={18} />
          </button>
        </div>
      </header>

      <div className="transactions-list-container">
        {groupedTransactions.length === 0 ? (
          <div className="empty-state">
            <Receipt size={48} className="empty-icon" />
            <p>No transactions found</p>
            <span>Add your first transaction to get started</span>
          </div>
        ) : (
          groupedTransactions.map(([date, dayTransactions]) => (
            <div key={date} className="transaction-group">
              <div className="date-header">
                <span className="date-label">
                  {format(parseISO(date), 'EEEE, MMMM do')}
                </span>
                <span className="date-total">
                  {formatCurrency(
                    dayTransactions.reduce((sum, t) => {
                      const converted = convertAmount(
                        t.amount,
                        (t.currency || 'USD') as CurrencyCode,
                        currency,
                        rates
                      );
                      return t.type === 'income' ? sum + converted : sum - converted;
                    }, 0),
                    currency
                  )}
                </span>
              </div>
              
              {dayTransactions.map(transaction => {
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
                    className={`transaction-card ${transaction.type}`}
                  >
                    <div className="transaction-main">
                      <div className={`transaction-icon ${transaction.type}`}>
                        <Receipt size={20} />
                      </div>
                      
                      <div className="transaction-details">
                        <span className="transaction-category">
                          {transaction.category}
                        </span>
                        {transaction.notes && (
                          <span className="transaction-notes">{transaction.notes}</span>
                        )}
                        {transaction.expenseType && (
                          <span className={`expense-tag ${transaction.expenseType}`}>
                            {transaction.expenseType}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="transaction-amount-section">
                      <div className="amounts">
                        <span className={`amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(convertedAmount, currency)}
                        </span>
                        {transactionCurrency !== currency && (
                          <span className="original-amount">
                            {formatCurrency(transaction.amount, transactionCurrency)}
                          </span>
                        )}
                      </div>
                      
                      <div className="transaction-actions">
                        <button 
                          className="action-btn"
                          onClick={() => handleEditTransaction(transaction)}
                          aria-label="Edit"
                        >
                          Edit
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteClick(transaction.id)}
                          aria-label="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Modal */}
      <TransactionForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTransactionAdded={(transaction) => {
          // Optimistically add to local state
          setTransactions(prev => [transaction, ...prev]);
          setShowAddModal(false);
          // Sync with server in background
          loadTransactions();
        }}
      />

      {/* Edit Transaction Modal */}
      <TransactionForm
        isOpen={!!editingTransaction}
        onClose={handleCloseEditModal}
        onTransactionAdded={(transaction) => {
          // Optimistically update local state
          setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
          handleCloseEditModal();
          // Sync with server in background
          loadTransactions();
        }}
        editingTransaction={editingTransaction}
        onCancelEdit={handleCloseEditModal}
      />

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
