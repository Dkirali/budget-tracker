import type { Transaction } from '@/types';

const STORAGE_KEY = 'budget-tracker-transactions';

export const storageService = {
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveTransaction(transaction: Transaction): void {
    try {
      const transactions = this.getTransactions();
      transactions.push(transaction);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  },

  updateTransaction(updatedTransaction: Transaction): void {
    try {
      const transactions = this.getTransactions();
      const index = transactions.findIndex(t => t.id === updatedTransaction.id);
      if (index !== -1) {
        transactions[index] = updatedTransaction;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  },

  deleteTransaction(id: string): void {
    try {
      const transactions = this.getTransactions();
      const filtered = transactions.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};
