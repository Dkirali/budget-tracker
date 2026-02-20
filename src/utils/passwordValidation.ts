export interface PasswordValidation {
  isValid: boolean;
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number; // 0-4
}

export const validatePassword = (password: string): PasswordValidation => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

  // Calculate score (0-4)
  let score = 0;
  if (minLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  // Determine strength
  let strength: PasswordValidation['strength'] = 'weak';
  if (score === 4) strength = 'strong';
  else if (score === 3) strength = 'good';
  else if (score === 2) strength = 'fair';

  const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return {
    isValid,
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    strength,
    score,
  };
};

export const getPasswordStrengthText = (validation: PasswordValidation): string => {
  if (validation.strength === 'strong') return 'Strong password';
  if (validation.strength === 'good') return 'Good password';
  if (validation.strength === 'fair') return 'Fair password';
  return 'Weak password';
};

export const getPasswordStrengthColor = (strength: PasswordValidation['strength']): string => {
  switch (strength) {
    case 'strong':
      return 'var(--color-accent-green)';
    case 'good':
      return '#22d3ee'; // cyan
    case 'fair':
      return 'var(--color-accent-orange)';
    default:
      return 'var(--color-accent-red)';
  }
};
