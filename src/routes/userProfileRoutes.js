import express from 'express';
import { createProfile, getProfile, updateProfile, deleteProfile } from '../controllers/userProfileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireCompleteProfileForOtherUser } from '../middleware/profileCompletionMiddleware.js';
import { requireOwnParam } from '../middleware/ownershipMiddleware.js';

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
router.post('/:userId', authenticateToken, requireOwnParam('userId'), createProfile);

/**
 * GET /api/v1/profiles/:userId
 * Get user profile
 * Requires: Authorization header with JWT token
 */
router.get('/:userId', authenticateToken, requireCompleteProfileForOtherUser, getProfile);

/**
 * PUT /api/v1/profiles/:userId
 * Update user profile
 * Requires: Authorization header with JWT token
 */
router.put('/:userId', authenticateToken, requireOwnParam('userId'), updateProfile);

/**
 * DELETE /api/v1/profiles/:userId
 * Delete user profile
 * Requires: Authorization header with JWT token
 */
router.delete('/:userId', authenticateToken, requireOwnParam('userId'), deleteProfile);

export default router;
