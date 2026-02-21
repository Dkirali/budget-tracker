import type { User, AuthSession, LoginCredentials, SignupData } from '@/context/AuthContext';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  signup(data: SignupData): Promise<AuthResult>;
  googleLogin(credential: string): Promise<AuthResult>;
  logout(): void;
  validateSession(token: string): Promise<boolean>;
}
