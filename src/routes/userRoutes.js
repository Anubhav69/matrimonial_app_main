import express from 'express';
import { getAllUsers, getUserById, deleteUser, searchUsers } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', searchUsers);

/**
 * User Management Routes
 * Base path: /api/v1/users
 * 
 * All routes require authentication via JWT token
 */

/**
 * GET /api/v1/users
 * Retrieve all users
 * Requires: Authorization header with JWT token
 */
router.get('/', authenticateToken, getAllUsers);

/**
 * GET /api/v1/users/:id
 * Retrieve specific user by ID
 * Requires: Authorization header with JWT token
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * DELETE /api/v1/users/:id
 * Delete user (soft delete)
 * Requires: Authorization header with JWT token
 */
router.delete('/:id', authenticateToken, deleteUser);

export default router;
