import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { validatePassword, getPasswordStrengthText, getPasswordStrengthColor } from '@/utils/passwordValidation';
import './Login.css';

type AuthMode = 'login' | 'signup';

export const Login = () => {
  const navigate = useNavigate();
  const { login, signup, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [emailError, setEmailError] = useState('');
  
  // Navigate to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const passwordValidation = validatePassword(formData.password);
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    
    if (mode === 'login') {
      await login({
        email: formData.email,
        password: formData.password,
      });
    } else {
      // Validate password for signup
      if (!passwordValidation.isValid) {
        return;
      }
      
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }
    // Navigation happens automatically via useEffect when isAuthenticated becomes true
  };
  
  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    clearError();
    setEmailError('');
    setFormData({ name: '', email: '', password: '' });
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo Section */}
        <div className="login-header">
          <div className="login-logo">
            <Wallet size={48} className="logo-icon" />
          </div>
          <h1 className="login-title">Budget Tracker</h1>
          <p className="login-subtitle">
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Name field - only for signup */}
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required={mode === 'signup'}
                  className="login-input"
                />
              </div>
            </div>
          )}
          
          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (emailError) setEmailError('');
                }}
                placeholder="you@example.com"
                required
                className={`login-input ${emailError ? 'error' : ''}`}
              />
            </div>
            {emailError && <span className="error-text">{emailError}</span>}
          </div>
          
          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="login-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password strength indicator - only for signup */}
            {mode === 'signup' && formData.password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`strength-bar ${passwordValidation.score >= level ? 'filled' : ''}`}
                      style={{
                        backgroundColor: passwordValidation.score >= level 
                          ? getPasswordStrengthColor(passwordValidation.strength)
                          : undefined
                      }}
                    />
                  ))}
                </div>
                <span 
                  className="strength-text"
                  style={{ color: getPasswordStrengthColor(passwordValidation.strength) }}
                >
                  {getPasswordStrengthText(passwordValidation)}
                </span>
                
                <ul className="password-requirements">
                  <li className={passwordValidation.minLength ? 'met' : ''}>
                    At least 8 characters
                  </li>
                  <li className={passwordValidation.hasUppercase ? 'met' : ''}>
                    One uppercase letter
                  </li>
                  <li className={passwordValidation.hasLowercase ? 'met' : ''}>
                    One lowercase letter
                  </li>
                  <li className={passwordValidation.hasNumber ? 'met' : ''}>
                    One number
                  </li>
                  <li className={passwordValidation.hasSpecialChar ? 'met' : ''}>
                    One special character (!@#$% etc.)
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading || (mode === 'signup' && !passwordValidation.isValid)}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
        
        {/* Toggle mode */}
        <div className="login-footer">
          <p>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              className="toggle-mode-btn"
              onClick={toggleMode}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
        
        {/* Password reminder */}
        {mode === 'login' && (
          <div className="password-reminder">
            <p>💡 Remember your password - there's no password reset available.</p>
          </div>
        )}
      </div>
    </div>
  );
};
