import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Data directory and file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Initialize data files if they don't exist
async function initializeDataFiles() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: {}, sessions: {} }, null, 2));
  }
  
  try {
    await fs.access(TRANSACTIONS_FILE);
  } catch {
    await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify({ transactions: {} }, null, 2));
  }
}

// Read users data
async function readUsersData() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: {}, sessions: {} };
  }
}

// Write users data
async function writeUsersData(data: any) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}

// Read transactions data
async function readTransactionsData() {
  try {
    const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading transactions file:', error);
    return { transactions: {} };
  }
}

// Write transactions data
async function writeTransactionsData(data: any) {
  try {
    await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing transactions file:', error);
    return false;
  }
}

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Create session
function createSession(userId: string, email: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  return {
    userId,
    email,
    token: generateUUID(),
    expiresAt: expiresAt.toISOString(),
  };
}

// ==================== AUTH ROUTES ====================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }
  
  const data = await readUsersData();
  
  // Check if email already exists
  const existingUser = Object.values(data.users).find(
    (u: any) => u.user.email === email
  );
  
  if (existingUser) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email already registered' 
    });
  }
  
  const userId = generateUUID();
  const user = {
    id: userId,
    email,
    name: name || email.split('@')[0],
    authProvider: 'password',
    createdAt: new Date().toISOString(),
  };
  
  const passwordHash = hashPassword(password);
  
  data.users[userId] = { user, passwordHash };
  
  if (await writeUsersData(data)) {
    const session = createSession(userId, email);
    return res.json({ 
      success: true, 
      user, 
      session 
    });
  } else {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to save user' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }
  
  const data = await readUsersData();
  
  const userRecord = Object.values(data.users).find(
    (u: any) => u.user.email === email
  ) as any;
  
  if (!userRecord) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid email or password' 
    });
  }
  
  const passwordHash = hashPassword(password);
  
  if (passwordHash !== userRecord.passwordHash) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid email or password' 
    });
  }
  
  const session = createSession(userRecord.user.id, userRecord.user.email);
  
  return res.json({ 
    success: true, 
    user: userRecord.user, 
    session 
  });
});

// ==================== TRANSACTIONS ROUTES ====================

// Get all transactions for a user
app.get('/api/transactions/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }
  
  const data = await readTransactionsData();
  const userTransactions = data.transactions[userId] || [];
  
  return res.json({ 
    success: true, 
    transactions: userTransactions 
  });
});

// Create a new transaction
app.post('/api/transactions/:userId', async (req, res) => {
  const { userId } = req.params;
  const transaction = req.body;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }
  
  if (!transaction || !transaction.id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Transaction data is required' 
    });
  }
  
  const data = await readTransactionsData();
  
  if (!data.transactions[userId]) {
    data.transactions[userId] = [];
  }
  
  data.transactions[userId].push(transaction);
  
  if (await writeTransactionsData(data)) {
    return res.json({ 
      success: true, 
      transaction 
    });
  } else {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to save transaction' 
    });
  }
});

// Update a transaction
app.put('/api/transactions/:userId/:transactionId', async (req, res) => {
  const { userId, transactionId } = req.params;
  const updatedTransaction = req.body;
  
  if (!userId || !transactionId) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID and Transaction ID are required' 
    });
  }
  
  const data = await readTransactionsData();
  
  if (!data.transactions[userId]) {
    return res.status(404).json({ 
      success: false, 
      error: 'No transactions found for this user' 
    });
  }
  
  const index = data.transactions[userId].findIndex(
    (t: any) => t.id === transactionId
  );
  
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'Transaction not found' 
    });
  }
  
  data.transactions[userId][index] = updatedTransaction;
  
  if (await writeTransactionsData(data)) {
    return res.json({ 
      success: true, 
      transaction: updatedTransaction 
    });
  } else {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update transaction' 
    });
  }
});

// Delete a transaction
app.delete('/api/transactions/:userId/:transactionId', async (req, res) => {
  const { userId, transactionId } = req.params;
  
  if (!userId || !transactionId) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID and Transaction ID are required' 
    });
  }
  
  const data = await readTransactionsData();
  
  if (!data.transactions[userId]) {
    return res.status(404).json({ 
      success: false, 
      error: 'No transactions found for this user' 
    });
  }
  
  const initialLength = data.transactions[userId].length;
  data.transactions[userId] = data.transactions[userId].filter(
    (t: any) => t.id !== transactionId
  );
  
  if (data.transactions[userId].length === initialLength) {
    return res.status(404).json({ 
      success: false, 
      error: 'Transaction not found' 
    });
  }
  
  if (await writeTransactionsData(data)) {
    return res.json({ 
      success: true, 
      message: 'Transaction deleted' 
    });
  } else {
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete transaction' 
    });
  }
});

// Clear all transactions for a user
app.delete('/api/transactions/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }
  
  const data = await readTransactionsData();
  
  if (data.transactions[userId]) {
    delete data.transactions[userId];
    
    if (await writeTransactionsData(data)) {
      return res.json({ 
        success: true, 
        message: 'All transactions cleared' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to clear transactions' 
      });
    }
  }
  
  return res.json({ 
    success: true, 
    message: 'No transactions to clear' 
  });
});

// ==================== DEBUG ROUTES ====================

// Get all users (for admin/debug purposes)
app.get('/api/users', async (req, res) => {
  const data = await readUsersData();
  const users = Object.values(data.users).map((u: any) => ({
    id: u.user.id,
    email: u.user.email,
    name: u.user.name,
    createdAt: u.user.createdAt,
  }));
  res.json({ users });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth server is running' });
});

// Initialize and start server
initializeDataFiles().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Users file: ${USERS_FILE}`);
    console.log(`Transactions file: ${TRANSACTIONS_FILE}`);
  });
});
