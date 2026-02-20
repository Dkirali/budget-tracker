import type { Transaction } from '@/types';

const STORAGE_KEY = 'budget-tracker-transactions';

// Helper to get user-specific storage key
const getUserStorageKey = (userId: string): string => `${STORAGE_KEY}-${userId}`;

// Get current user ID from auth session
const getCurrentUserId = (): string | null => {
  try {
    const session = localStorage.getItem('budget-tracker-auth-session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.userId || null;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  return null;
};

export const storageService = {
  getTransactions(userId?: string): Transaction[] {
    try {
      const uid = userId || getCurrentUserId();
      const key = uid ? getUserStorageKey(uid) : STORAGE_KEY;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveTransaction(transaction: Transaction, userId?: string): void {
    try {
      const uid = userId || getCurrentUserId() || undefined;
      const key = uid ? getUserStorageKey(uid) : STORAGE_KEY;
      const transactions = this.getTransactions(uid);
      transactions.push(transaction);
      localStorage.setItem(key, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  },

  updateTransaction(updatedTransaction: Transaction, userId?: string): void {
    try {
      const uid = userId || getCurrentUserId() || undefined;
      const key = uid ? getUserStorageKey(uid) : STORAGE_KEY;
      const transactions = this.getTransactions(uid);
      const index = transactions.findIndex(t => t.id === updatedTransaction.id);
      if (index !== -1) {
        transactions[index] = updatedTransaction;
        localStorage.setItem(key, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  },

  deleteTransaction(id: string, userId?: string): void {
    try {
      const uid = userId || getCurrentUserId() || undefined;
      const key = uid ? getUserStorageKey(uid) : STORAGE_KEY;
      const transactions = this.getTransactions(uid);
      const filtered = transactions.filter(t => t.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  clearAll(userId?: string): void {
    try {
      const uid = userId || getCurrentUserId();
      const key = uid ? getUserStorageKey(uid) : STORAGE_KEY;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};
