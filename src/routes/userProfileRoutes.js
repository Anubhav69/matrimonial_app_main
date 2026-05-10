import express from 'express';
import { createProfile, getProfile, updateProfile, deleteProfile } from '../controllers/userProfileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * User Profile Routes
 * Base path: /api/v1/profiles
 * 
 * All routes require authentication via JWT token
 */

/**
 * POST /api/v1/profiles/:userId
 * Create user profile
 * Requires: Authorization header with JWT token
 */
router.post('/:userId', authenticateToken, createProfile);

/**
 * GET /api/v1/profiles/:userId
 * Get user profile
 * Requires: Authorization header with JWT token
 */
router.get('/:userId', authenticateToken, getProfile);

/**
 * PUT /api/v1/profiles/:userId
 * Update user profile
 * Requires: Authorization header with JWT token
 */
router.put('/:userId', authenticateToken, updateProfile);

/**
 * DELETE /api/v1/profiles/:userId
 * Delete user profile
 * Requires: Authorization header with JWT token
 */
router.delete('/:userId', authenticateToken, deleteProfile);

export default router;
