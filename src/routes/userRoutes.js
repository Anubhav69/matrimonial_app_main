import express from 'express';
import { getAllUsers, getUserById, deleteUser } from '../controllers/userController.js';

const router = express.Router();

/**
 * User Management Routes
 * Base path: /api/v1/users
 */

/**
 * GET /api/v1/users
 * Retrieve all users
 */
router.get('/', getAllUsers);

/**
 * GET /api/v1/users/:id
 * Retrieve specific user by ID
 */
router.get('/:id', getUserById);

/**
 * DELETE /api/v1/users/:id
 * Delete user (soft delete)
 */
router.delete('/:id', deleteUser);

export default router;
