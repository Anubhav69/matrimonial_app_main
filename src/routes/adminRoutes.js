import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/rbacMiddleware.js';
import {
  getPendingProfilesCount,
  getPendingProfiles,
  getAllProfiles,
  approveProfile,
  rejectProfile,
  createAdmin,
  getPendingAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getAllAdmins,
  getDashboardStats
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * Admin Routes
 * Base path: /api/v1/admin
 * 
 * All routes require authentication + admin/super_admin role
 */

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard/stats
 * Dashboard statistics (Admin + Super Admin)
 */
router.get('/dashboard/stats', authenticateToken, requireAdmin, getDashboardStats);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE MANAGEMENT (Admin + Super Admin)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/profiles/pending/count
 * Count of pending profiles
 */
router.get('/profiles/pending/count', authenticateToken, requireAdmin, getPendingProfilesCount);

/**
 * GET /api/v1/admin/profiles/pending
 * List all pending profiles with pagination
 * Query params: page, limit
 */
router.get('/profiles/pending', authenticateToken, requireAdmin, getPendingProfiles);

/**
 * GET /api/v1/admin/profiles
 * List all profiles with optional filters
 * Query params: status (pending|published|rejected), search, page, limit
 */
router.get('/profiles', authenticateToken, requireAdmin, getAllProfiles);

/**
 * PATCH /api/v1/admin/profiles/:userId/approve
 * Approve a user profile → published
 */
router.patch('/profiles/:userId/approve', authenticateToken, requireAdmin, approveProfile);

/**
 * PATCH /api/v1/admin/profiles/:userId/reject
 * Reject a user profile
 * Body: { reason: "optional rejection reason" }
 */
router.patch('/profiles/:userId/reject', authenticateToken, requireAdmin, rejectProfile);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/create-admin
 * Create a new admin
 * - If super_admin: creates admin directly
 * - If admin: creates a pending request for super_admin approval
 * Body: { email, phone, password }
 */
router.post('/create-admin', authenticateToken, requireAdmin, createAdmin);

/**
 * GET /api/v1/admin/admin-requests/pending
 * List pending admin creation requests (Super Admin only)
 * Query params: page, limit
 */
router.get('/admin-requests/pending', authenticateToken, requireSuperAdmin, getPendingAdminRequests);

/**
 * PATCH /api/v1/admin/admin-requests/:id/approve
 * Approve an admin creation request (Super Admin only)
 */
router.patch('/admin-requests/:id/approve', authenticateToken, requireSuperAdmin, approveAdminRequest);

/**
 * PATCH /api/v1/admin/admin-requests/:id/reject
 * Reject an admin creation request (Super Admin only)
 * Body: { reason: "optional rejection reason" }
 */
router.patch('/admin-requests/:id/reject', authenticateToken, requireSuperAdmin, rejectAdminRequest);

/**
 * GET /api/v1/admin/admins
 * List all admin users (Super Admin only)
 */
router.get('/admins', authenticateToken, requireSuperAdmin, getAllAdmins);

export default router;

