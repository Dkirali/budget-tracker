import SHA256 from 'crypto-js/sha256';
import { uuidv4 } from '@/utils/uuid';
import type { IAuthService, AuthResult } from './authService';
import type { User, AuthSession, LoginCredentials, SignupData } from '@/context/AuthContext';

const USERS_KEY = 'budget-tracker-users';

// Simple hash function for passwords
const hashPassword = (password: string): string => {
  return SHA256(password).toString();
};

// Generate a simple session token
const generateToken = (): string => {
  return uuidv4();
};

// Create session with 7-day expiry
const createSession = (userId: string, email: string): AuthSession => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return {
    userId,
    email,
    token: generateToken(),
    expiresAt: expiresAt.toISOString(),
  };
};

// Get all registered users from storage
const getUsers = (): Record<string, { user: User; passwordHash: string }> => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
};

// Save users to storage
const saveUsers = (users: Record<string, { user: User; passwordHash: string }>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const localAuthService: IAuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const users = getUsers();
    const userRecord = Object.values(users).find(u => u.user.email === credentials.email);

    if (!userRecord) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    const passwordHash = hashPassword(credentials.password);

    if (passwordHash !== userRecord.passwordHash) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    const session = createSession(userRecord.user.id, userRecord.user.email);

    return {
      success: true,
      user: userRecord.user,
      session,
    };
  },

  async signup(data: SignupData): Promise<AuthResult> {
    const users = getUsers();

    // Check if email already exists
    const existingUser = Object.values(users).find(u => u.user.email === data.email);

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }

    const user: User = {
      id: uuidv4(),
      email: data.email,
      name: data.name,
      authProvider: 'password',
      createdAt: new Date().toISOString(),
    };

    const passwordHash = hashPassword(data.password);

    users[user.id] = { user, passwordHash };
    saveUsers(users);

    const session = createSession(user.id, user.email);

    return {
      success: true,
      user,
      session,
    };
  },

  async googleLogin(_credential: string): Promise<AuthResult> {
    // TODO: Implement Google OAuth when credentials are available
    return {
      success: false,
      error: 'Google login not yet implemented',
    };
  },

  logout(): void {
    // Handled by AuthContext
  },

  async validateSession(_token: string): Promise<boolean> {
    // Session validation is handled by AuthContext
    return true;
  },
};
