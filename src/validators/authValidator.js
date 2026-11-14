/**
 * Authentication Validators
 * Validation functions for user authentication (signup, login)
 */

export const validateEmail = (email) => {
  if (!email) return { isValid: true };

  if (typeof email !== 'string' || email.length > 255) {
    throw new Error('Invalid email format');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return { isValid: true };
};

export const validatePhone = (phone) => {
  if (!phone) return { isValid: true };

  if (typeof phone !== 'string' || phone.length > 20 || !/^[+0-9().\s-]+$/.test(phone)) {
    throw new Error('Invalid phone number format');
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Invalid phone number format');
  }
  return { isValid: true };
};

export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.trim().length === 0) {
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
