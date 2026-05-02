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

export { signUp, login };
