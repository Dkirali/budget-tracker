import { useState, useMemo } from 'react';
import { PlusCircle, ArrowRightLeft } from 'lucide-react';
import type { 
  TransactionType, 
  TransactionFormData, 
  IncomeCategory,
  ExpenseCategory,
  Transaction
} from '@/types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { CURRENCIES, type CurrencyCode } from '@/types/currency';
import { storageService } from '@/services/storage';
import { generateId } from '@/utils/calculations';
import { useCurrency } from '@/context/useCurrency';
import { useExchangeRates } from '@/context/useExchangeRates';
import { convertAmount } from '@/utils/conversions';
import { formatCurrency } from '@/utils/formatCurrency';
import './TransactionForm.css';

interface TransactionFormProps {
  onTransactionAdded: () => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

const initialFormData: TransactionFormData = {
  type: 'expense',
  category: 'food',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  expenseType: 'leisure',
  isRecurring: false
};

export const TransactionForm = ({ 
  onTransactionAdded, 
  editingTransaction,
  onCancelEdit 
}: TransactionFormProps) => {
  const [formData, setFormData] = useState<TransactionFormData>(
    editingTransaction 
      ? {
          type: editingTransaction.type,
          category: editingTransaction.category,
          amount: editingTransaction.amount.toString(),
          date: editingTransaction.date,
          notes: editingTransaction.notes || '',
          expenseType: editingTransaction.expenseType || 'leisure',
          isRecurring: editingTransaction.isRecurring || false
        }
      : initialFormData
  );
  const [showForm, setShowForm] = useState(!!editingTransaction);
  // Local currency state for this transaction only
  const [transactionCurrency, setTransactionCurrency] = useState<CurrencyCode>(
    (editingTransaction?.currency as CurrencyCode) || 'USD'
  );
  
  const { currency: globalCurrency } = useCurrency();
  const { rates } = useExchangeRates();

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: (type === 'income' ? 'salary' : 'food') as IncomeCategory | ExpenseCategory
    }));
  };

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericValue;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  const displayAmount = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('en-US');
  };

  // Calculate exchange rate display
  const exchangeRate = useMemo(() => {
    if (transactionCurrency === globalCurrency) return null;
    const rate = convertAmount(1, transactionCurrency, globalCurrency, rates);
    return rate;
  }, [transactionCurrency, globalCurrency, rates]);

  const convertedAmount = useMemo(() => {
    if (!formData.amount || transactionCurrency === globalCurrency) return null;
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return null;
    return convertAmount(amount, transactionCurrency, globalCurrency, rates);
  }, [formData.amount, transactionCurrency, globalCurrency, rates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const transaction = {
      id: editingTransaction?.id || generateId(),
      type: formData.type,
      category: formData.category as IncomeCategory | ExpenseCategory,
      amount,
      date: formData.date,
      notes: formData.notes.trim() || undefined,
      currency: transactionCurrency,
      ...(formData.type === 'expense' && {
        expenseType: formData.expenseType,
        isRecurring: formData.isRecurring
      })
    };

    if (editingTransaction) {
      storageService.updateTransaction(transaction);
      onCancelEdit?.();
    } else {
      storageService.saveTransaction(transaction);
    }
    
    setFormData(initialFormData);
    setTransactionCurrency(globalCurrency);
    setShowForm(false);
    onTransactionAdded();
  };

  const handleCancel = () => {
    if (editingTransaction) {
      onCancelEdit?.();
    } else {
      setShowForm(false);
      setFormData(initialFormData);
      setTransactionCurrency(globalCurrency);
    }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  if (!showForm) {
    return (
      <button 
        className="add-transaction-btn"
        onClick={() => setShowForm(true)}
      >
        <PlusCircle size={20} />
        Add Transaction
      </button>
    );
  }

  return (
    <div className="transaction-form-overlay">
      <div className="transaction-form-container">
        <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
        
        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-group type-selector">
            <label>Transaction Type</label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-btn ${formData.type === 'income' ? 'active' : ''}`}
                onClick={() => handleTypeChange('income')}
              >
                Income
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'expense' ? 'active' : ''}`}
                onClick={() => handleTypeChange('expense')}
              >
                Expense
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                category: e.target.value as IncomeCategory | ExpenseCategory 
              }))}
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {formData.type === 'expense' && (
            <>
              <div className="form-group type-selector">
                <label>Expense Type</label>
                <div className="type-buttons">
                  <button
                    type="button"
                    className={`type-btn ${formData.expenseType === 'mandatory' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, expenseType: 'mandatory' }))}
                  >
                    Mandatory
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${formData.expenseType === 'leisure' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, expenseType: 'leisure' }))}
                  >
                    Leisure
                  </button>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  />
                  <span>Recurring</span>
                </label>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <div className="amount-input-wrapper">
                <input
                  type="text"
                  id="amount"
                  value={displayAmount(formData.amount)}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="amount-input"
                  required
                />
                <span className="amount-currency">{CURRENCIES[transactionCurrency].symbol}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="form-group currency-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                value={transactionCurrency}
                onChange={(e) => setTransactionCurrency(e.target.value as CurrencyCode)}
                className="currency-select"
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {exchangeRate && convertedAmount && (
            <div className="exchange-rate-info">
              <div className="rate-display">
                <ArrowRightLeft size={14} className="rate-icon" />
                <span className="rate-text">
                  1 {transactionCurrency} = {exchangeRate.toFixed(4)} {globalCurrency}
                </span>
              </div>
              <div className="converted-amount">
                <span>≈ {formatCurrency(convertedAmount, globalCurrency)}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
            >
              {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
