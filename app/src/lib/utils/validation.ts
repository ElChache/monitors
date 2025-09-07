/**
 * Form validation utilities for Monitors! authentication
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult & { 
  strength: number; 
  feedback: string;
} {
  if (!password) {
    return { 
      isValid: false, 
      error: 'Password is required',
      strength: 0,
      feedback: ''
    };
  }
  
  if (password.length < 8) {
    return { 
      isValid: false, 
      error: 'Password must be at least 8 characters',
      strength: 1,
      feedback: 'Password must be at least 8 characters'
    };
  }
  
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const strength = Math.min(score, 4);
  let feedback = '';
  let isValid = strength >= 2; // Require at least "fair" strength
  
  if (strength === 1) feedback = 'Weak password - add uppercase, numbers, or symbols';
  else if (strength === 2) feedback = 'Fair password - consider adding more variety';
  else if (strength === 3) feedback = 'Good password - very secure';
  else if (strength === 4) feedback = 'Excellent password - maximum security';
  
  return { 
    isValid,
    error: isValid ? undefined : 'Please choose a stronger password',
    strength,
    feedback
  };
}

/**
 * Validate name field
 */
export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
}

/**
 * Get password strength color class
 */
export function getPasswordStrengthColor(strength: number): string {
  if (strength <= 1) return 'bg-accent';
  if (strength === 2) return 'bg-warning';
  if (strength >= 3) return 'bg-secondary';
  return 'bg-secondary';
}

/**
 * Get password strength percentage width
 */
export function getPasswordStrengthWidth(strength: number): string {
  return `${(strength / 4) * 100}%`;
}

/**
 * Real-time form validation hook for Svelte
 */
export function createFormValidator() {
  let errors: Record<string, string> = {};
  let touched: Record<string, boolean> = {};
  
  const validateField = (field: string, value: any, validator: (value: any) => ValidationResult) => {
    const result = validator(value);
    
    if (result.isValid) {
      delete errors[field];
    } else {
      errors[field] = result.error!;
    }
    
    return result;
  };
  
  const touchField = (field: string) => {
    touched[field] = true;
  };
  
  const isFieldTouched = (field: string) => touched[field] || false;
  
  const getFieldError = (field: string) => errors[field];
  
  const hasErrors = () => Object.keys(errors).length > 0;
  
  const reset = () => {
    errors = {};
    touched = {};
  };
  
  return {
    validateField,
    touchField,
    isFieldTouched,
    getFieldError,
    hasErrors,
    reset
  };
}