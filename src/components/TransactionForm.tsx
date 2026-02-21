import { useState, useMemo, useEffect } from 'react';
import { ArrowRightLeft, X, Loader2 } from 'lucide-react';
import { Dropdown } from '@/components/Dropdown';
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
  onSubmit: (transaction: Transaction) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
  isOpen: boolean;
  onClose: () => void;
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
  onSubmit, 
  editingTransaction,
  onCancelEdit,
  isOpen,
  onClose
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
  
  const { currency: globalCurrency } = useCurrency();
  
  const [transactionCurrency, setTransactionCurrency] = useState<CurrencyCode>(
    (editingTransaction?.currency as CurrencyCode) || globalCurrency
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const { rates } = useExchangeRates();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Update form when editing transaction changes
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        category: editingTransaction.category,
        amount: editingTransaction.amount.toString(),
        date: editingTransaction.date,
        notes: editingTransaction.notes || '',
        expenseType: editingTransaction.expenseType || 'leisure',
        isRecurring: editingTransaction.isRecurring || false
      });
      setTransactionCurrency((editingTransaction?.currency as CurrencyCode) || 'USD');
    }
  }, [editingTransaction]);

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: (type === 'income' ? 'salary' : 'food') as IncomeCategory | ExpenseCategory
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Allow user to type, only strip non-numeric except decimal point
    const cleaned = rawValue.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  const displayAmount = (value: string) => {
    // Return raw value for controlled input - don't format with commas
    // This ensures the cursor stays at the end and editing works smoothly
    return value;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    setIsLoading(true);

    try {
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
        await storageService.updateTransaction(transaction);
        onCancelEdit?.();
      } else {
        await storageService.saveTransaction(transaction);
      }

      setFormData(initialFormData);
      setTransactionCurrency(globalCurrency);
      // Pass transaction back to parent for optimistic update
      onSubmit(transaction);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (editingTransaction) {
      onCancelEdit?.();
    }
    setFormData(initialFormData);
    setTransactionCurrency(globalCurrency);
    onClose();
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  if (!isOpen) return null;

  return (
    <div className="transaction-form-overlay" onClick={handleCancel}>
      <div className="transaction-form-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-x" onClick={handleCancel} aria-label="Close">
          <X size={24} />
        </button>
        
        <div className="form-header">
          <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-scroll-content">
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
              <Dropdown
                id="category"
                label="Category"
                options={categories.map(cat => ({ value: cat.value, label: cat.label }))}
                value={formData.category}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  category: value as IncomeCategory | ExpenseCategory 
                }))}
                required
              />
            </div>

            {formData.type === 'expense' && (
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
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <div className="amount-input-wrapper">
                  <input
                    type="text"
                    inputMode="decimal"
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
                <Dropdown
                  id="currency"
                  label="Currency"
                  options={Object.values(CURRENCIES).map((curr) => ({
                    value: curr.code,
                    label: `${curr.code} (${curr.symbol})`,
                  }))}
                  value={transactionCurrency}
                  onChange={(value) => setTransactionCurrency(value as CurrencyCode)}
                />
              </div>

              {formData.type === 'expense' && (
                <div className="form-group recurring-group">
                  <label>Recurring</label>
                  <div className="yes-no-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${!formData.isRecurring ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, isRecurring: false }))}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${formData.isRecurring ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, isRecurring: true }))}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                rows={2}
              />
            </div>
          </div>

          <div className="form-actions-fixed">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  {editingTransaction ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                editingTransaction ? 'Update' : 'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
