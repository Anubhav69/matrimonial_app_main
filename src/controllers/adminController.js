import AdminService from '../services/adminService.js';

/**
 * AdminController - Handles admin panel requests
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE MANAGEMENT (Admin + Super Admin)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/profiles/pending/count
 * Get count of pending profiles
 */
const getPendingProfilesCount = async (req, res) => {
  try {
    const result = await AdminService.getPendingProfilesCount();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending profiles count',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/admin/profiles/pending
 * List all pending profiles
 */
const getPendingProfiles = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await AdminService.getPendingProfiles({ page, limit });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending profiles',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/admin/profiles
 * List all profiles with filters
 */
const getAllProfiles = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await AdminService.getAllProfiles(
      { status, search },
      { page, limit }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profiles',
      error: error.message
    });
  }
};

/**
 * PATCH /api/v1/admin/profiles/:userId/approve
 * Approve a user profile
 */
const approveProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await AdminService.approveProfile(userId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Profile not found' ? 404 :
                       error.message === 'Profile is already published' ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to approve profile',
      error: error.message
    });
  }
};

/**
 * PATCH /api/v1/admin/profiles/:userId/reject
 * Reject a user profile
 */
const rejectProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const result = await AdminService.rejectProfile(userId, req.user.id, reason);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Profile not found' ? 404 :
                       error.message === 'Profile is already rejected' ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to reject profile',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/create-admin
 * Create admin (direct if super_admin, pending request if admin)
 */
const createAdmin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const result = await AdminService.createAdmin(
      req.user.role,
      req.user.id,
      { email, phone, password }
    );

    const statusCode = req.user.role === 'super_admin' ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (error) {
    const statusCode = error.message.includes('already registered') || 
                       error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create admin',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/admin/admin-requests/pending
 * List pending admin creation requests (Super Admin only)
 */
const getPendingAdminRequests = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await AdminService.getPendingAdminRequests({ page, limit });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending admin requests',
      error: error.message
    });
  }
};

/**
 * PATCH /api/v1/admin/admin-requests/:id/approve
 * Approve admin creation request (Super Admin only)
 */
const approveAdminRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminService.approveAdminRequest(id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Admin request not found' ? 404 :
                       error.message.includes('already been') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to approve admin request',
      error: error.message
    });
  }
};

/**
 * PATCH /api/v1/admin/admin-requests/:id/reject
 * Reject admin creation request (Super Admin only)
 */
const rejectAdminRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await AdminService.rejectAdminRequest(id, req.user.id, reason);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Admin request not found' ? 404 :
                       error.message.includes('already been') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to reject admin request',
      error: error.message
    });
  }
};

/**
 * GET /api/v1/admin/admins
 * Admins see their peers; super admins see admins and super admins
 */
const getAllAdmins = async (req, res) => {
  try {
    const result = await AdminService.getAllAdmins(req.user.role, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get admins',
      error: error.message
    });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const result = await AdminService.updateAdmin(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Admin not found' ? 404 :
      error.message.includes('already registered') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to update admin',
      error: error.message
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const result = await AdminService.deleteAdmin(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Admin not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete admin',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard/stats
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const result = await AdminService.getDashboardStats(req.user.role);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    });
  }
};

export {
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
  updateAdmin,
  deleteAdmin,
  getDashboardStats
};
