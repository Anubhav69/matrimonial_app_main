import express from 'express';
import { signUp, login } from '../controllers/authController.js';

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

export default router;
