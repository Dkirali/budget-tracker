import type { Transaction } from '@/types';

const API_URL = 'http://localhost:3002/api';

// Helper to get current user ID from auth session
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
  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      const uid = userId || getCurrentUserId();
      if (!uid) {
        console.warn('No user ID available for fetching transactions');
        return [];
      }

      const response = await fetch(`${API_URL}/transactions/${uid}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  async saveTransaction(transaction: Transaction, userId?: string): Promise<boolean> {
    try {
      const uid = userId || getCurrentUserId();
      if (!uid) {
        console.warn('No user ID available for saving transaction');
        return false;
      }

      const response = await fetch(`${API_URL}/transactions/${uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error saving transaction:', error);
      return false;
    }
  },

  async updateTransaction(updatedTransaction: Transaction, userId?: string): Promise<boolean> {
    try {
      const uid = userId || getCurrentUserId();
      if (!uid) {
        console.warn('No user ID available for updating transaction');
        return false;
      }

      const response = await fetch(`${API_URL}/transactions/${uid}/${updatedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  },

  async deleteTransaction(id: string, userId?: string): Promise<boolean> {
    try {
      const uid = userId || getCurrentUserId();
      if (!uid) {
        console.warn('No user ID available for deleting transaction');
        return false;
      }

      const response = await fetch(`${API_URL}/transactions/${uid}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  },

  async clearAll(userId?: string): Promise<boolean> {
    try {
      const uid = userId || getCurrentUserId();
      if (!uid) {
        console.warn('No user ID available for clearing transactions');
        return false;
      }

      const response = await fetch(`${API_URL}/transactions/${uid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing transactions:', error);
      return false;
    }
  }
};
