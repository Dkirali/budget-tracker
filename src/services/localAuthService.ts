import type { IAuthService, AuthResult } from './authService';
import type { LoginCredentials, SignupData } from '@/context/AuthContext';

const API_URL = 'http://localhost:3002/api';

export const localAuthService: IAuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Login failed',
        };
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  async signup(data: SignupData): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Signup failed',
        };
      }

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  async googleLogin(_credential: string): Promise<AuthResult> {
    return {
      success: false,
      error: 'Google login not yet implemented',
    };
  },

  logout(): void {
    // Handled by AuthContext
  },

  async validateSession(_token: string): Promise<boolean> {
    return true;
  },
};
