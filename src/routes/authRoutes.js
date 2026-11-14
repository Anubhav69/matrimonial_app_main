import express from 'express';
import { signUp, login, forgotPassword, verifyPasswordResetOtp, resetPassword } from '../controllers/authController.js';

const router = express.Router();

/**
 * Authentication Routes
 * Base path: /api/v1/auth
 */

/**
 * POST /api/v1/auth/signup
 * Register a new user account
 */
router.post('/signup', signUp);

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPassword);

export default router;
