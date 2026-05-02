/**
 * Authentication Validators
 * Validation functions for user authentication (signup, login)
 */

export const validateEmail = (email) => {
  if (!email) return { isValid: true };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return { isValid: true };
};

export const validatePhone = (phone) => {
  if (!phone) return { isValid: true };
  
  const phoneRegex = /^[0-9]{10,}$/;
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    throw new Error('Invalid phone number format');
  }
  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password || password.trim().length === 0) {
    throw new Error('Password is required');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  return { isValid: true };
};

export const validateSignUpData = (data) => {
  const { email, phone, password } = data;
  
  if (!email && !phone) {
    throw new Error('Either email or phone number must be provided');
  }
  
  validateEmail(email);
  validatePhone(phone);
  validatePassword(password);
  
  return { isValid: true };
};

export const validateLoginData = (data) => {
  const { emailOrPhone, password } = data;
  
  if (!emailOrPhone || emailOrPhone.trim().length === 0) {
    throw new Error('Email or phone number is required');
  }
  
  if (!password || password.trim().length === 0) {
    throw new Error('Password is required');
  }
  
  return { isValid: true };
};
