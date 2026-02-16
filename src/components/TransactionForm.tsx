import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import type { 
  TransactionType, 
  TransactionFormData, 
  IncomeCategory,
  ExpenseCategory 
} from '@/types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { CURRENCIES } from '@/types/currency';
import { storageService } from '@/services/storage';
import { generateId } from '@/utils/calculations';
import { useCurrency } from '@/context/useCurrency';
import './TransactionForm.css';

interface TransactionFormProps {
  onTransactionAdded: () => void;
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

export const TransactionForm = ({ onTransactionAdded }: TransactionFormProps) => {
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [showForm, setShowForm] = useState(false);
  const { currency, setCurrency } = useCurrency();

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: (type === 'income' ? 'salary' : 'food') as IncomeCategory | ExpenseCategory
    }));
  };

  const formatAmount = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const transaction = {
      id: generateId(),
      type: formData.type,
      category: formData.category as IncomeCategory | ExpenseCategory,
      amount,
      date: formData.date,
      notes: formData.notes.trim() || undefined,
      currency: currency,
      ...(formData.type === 'expense' && {
        expenseType: formData.expenseType,
        isRecurring: formData.isRecurring
      })
    };

    storageService.saveTransaction(transaction);
    setFormData(initialFormData);
    setShowForm(false);
    onTransactionAdded();
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
        <h2>Add Transaction</h2>
        
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
                <span className="amount-currency">{CURRENCIES[currency].symbol}</span>
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
                value={currency}
                onChange={(e) => setCurrency(e.target.value as typeof currency)}
                className="currency-select"
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.flag} {curr.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
