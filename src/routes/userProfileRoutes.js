import express from 'express';
import { createProfile, getProfile, updateProfile, deleteProfile } from '../controllers/userProfileController.js';

const router = express.Router();

/**
 * User Profile Routes
 * Base path: /api/v1/profiles
 */

/**
 * POST /api/v1/profiles/:userId
 * Create user profile
 */
router.post('/:userId', createProfile);

/**
 * GET /api/v1/profiles/:userId
 * Get user profile
 */
router.get('/:userId', getProfile);

/**
 * PUT /api/v1/profiles/:userId
 * Update user profile
 */
router.put('/:userId', updateProfile);

/**
 * DELETE /api/v1/profiles/:userId
 * Delete user profile
 */
router.delete('/:userId', deleteProfile);

export default router;
