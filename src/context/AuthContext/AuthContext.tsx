import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './AuthContextDefinition';
import { localAuthService } from '@/services/localAuthService';
import type { AuthState, LoginCredentials, SignupData, User } from './authTypes';

const SESSION_KEY = 'budget-tracker-auth-session';
const USER_KEY = 'budget-tracker-user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const session = localStorage.getItem(SESSION_KEY);
        const userData = localStorage.getItem(USER_KEY);

        if (session && userData) {
          const parsedSession = JSON.parse(session);
          const parsedUser: User = JSON.parse(userData);

          // Check if session is expired
          if (new Date(parsedSession.expiresAt) > new Date()) {
            setAuthState({
              user: parsedUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Session expired, clear it
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(USER_KEY);
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to restore session',
        });
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await localAuthService.login(credentials);

      if (result.success && result.user && result.session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(result.session));
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));

        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Login failed',
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'An unexpected error occurred',
      }));
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await localAuthService.signup(data);

      if (result.success && result.user && result.session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(result.session));
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));

        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Signup failed',
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'An unexpected error occurred',
      }));
    }
  }, []);

  const googleLogin = useCallback(async (_credential: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Implement Google OAuth when ready
      // For now, placeholder
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Google login not yet implemented',
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Google login failed',
      }));
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const contextValue = useMemo(
    () => ({
      ...authState,
      login,
      signup,
      logout,
      googleLogin,
      clearError,
    }),
    [authState, login, signup, logout, googleLogin, clearError]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
