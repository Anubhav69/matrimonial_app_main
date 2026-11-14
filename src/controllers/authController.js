import AuthService from '../services/authService.js';

/**
 * AuthController - Handles authentication requests
 */

/**
 * User Sign-Up
 */
const signUp = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    const result = await AuthService.signUp({
      email,
      phone,
      password
    });

    res.status(201).json(result);
  } catch (error) {
    const statusCode = error.message.includes('already registered') ? 409 : 400;
    
    res.status(statusCode).json({
      success: false,
      message: 'Sign-up failed',
      error: error.message
    });
  }
};

/**
 * User Login
 */
const login = async (req, res) => {
  try {
    const { emailOrPhone, email, phone, password } = req.body;

    const identifier = emailOrPhone || email || phone;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and password are required'
      });
    }

    const result = await AuthService.login({
      emailOrPhone: identifier,
      password
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const identifier = String(req.body?.emailOrPhone || req.body?.email || req.body?.phone || '').trim();
    if (!identifier) return res.status(400).json({ success: false, error: 'Email or phone number is required' });
    res.status(200).json(await AuthService.requestPasswordReset(identifier));
  } catch (error) {
    res.status(200).json({ success: true, message: 'If the account exists, a reset email has been sent' });
  }
};

const resetPassword = async (req, res) => {
  try {
    res.status(200).json(await AuthService.resetPassword(String(req.body?.token || ''), String(req.body?.password || ''), String(req.body?.confirmPassword || '')));
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const verifyPasswordResetOtp = async (req, res) => {
  try {
    res.status(200).json(await AuthService.verifyPasswordResetOtp(String(req.body?.emailOrPhone || ''), String(req.body?.otp || '')));
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export { signUp, login, forgotPassword, verifyPasswordResetOtp, resetPassword };
