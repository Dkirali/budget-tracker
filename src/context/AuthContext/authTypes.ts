export interface User {
  id: string;
  email: string;
  name: string;
  authProvider: 'password' | 'google';
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  googleLogin: (credential: string) => Promise<void>;
  clearError: () => void;
}
