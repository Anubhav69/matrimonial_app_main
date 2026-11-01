import bcryptjs from 'bcryptjs';
import { Op } from 'sequelize';
import { User, UserProfile, CareerDetail, UserEducation, UserPhoto } from '../models/index.js';
import AdminRequest from '../models/AdminRequest.js';

/**
 * AdminService - Handles admin panel business logic
 */
class AdminService {

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE MANAGEMENT (Admin + Super Admin)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get count of pending profiles
   */
  static async getPendingProfilesCount() {
    const count = await UserProfile.count({
      where: { profile_status: 'pending' }
    });

    return {
      success: true,
      data: { pending_count: count }
    };
  }

  /**
   * Get all pending profiles with user details
   */
  static async getPendingProfiles(pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { is_deleted: false, role: 'user' },
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: UserProfile,
          where: { profile_status: 'pending' },
          required: true
        },
        {
          model: CareerDetail,
          required: false
        },
        {
          model: UserEducation,
          required: false
        },
        {
          model: UserPhoto,
          required: false,
          attributes: ['id', 'photo_url', 'is_primary']
        }
      ],
      order: [['created_at', 'ASC']],
      limit,
      offset,
      distinct: true
    });

    return {
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get all profiles with optional status filter
   */
  static async getAllProfiles(filters = {}, pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const profileWhere = {};
    let searchTerm;
    if (filters.status) {
      profileWhere.profile_status = filters.status;
    }

    const userWhere = { is_deleted: false, role: 'user' };
    if (filters.search) {
      searchTerm = `%${filters.search}%`;
      userWhere[Op.or] = [
        { email: { [Op.like]: searchTerm } },
        { phone: { [Op.like]: searchTerm } }
      ];
      profileWhere[Op.or] = [
        { first_name: { [Op.like]: searchTerm } },
        { last_name: { [Op.like]: searchTerm } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: userWhere,
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: UserProfile,
          where: Reflect.ownKeys(profileWhere).length > 0 ? profileWhere : undefined,
          required: true
        },
        {
          model: CareerDetail,
          required: false
        },
        {
          model: UserEducation,
          required: false
        },
        {
          model: UserPhoto,
          required: false,
          attributes: ['id', 'photo_url', 'is_primary']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    return {
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Approve a user profile → set profile_status to 'published'
   */
  static async approveProfile(userId, adminId) {
    const profile = await UserProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw new Error('Profile not found');

    if (profile.profile_status === 'published') {
      throw new Error('Profile is already published');
    }

    await profile.update({ profile_status: 'published' });

    // Also mark user as verified
    await User.update(
      { is_verified: true },
      { where: { id: userId } }
    );

    return {
      success: true,
      message: 'Profile approved and published successfully',
      data: {
        user_id: userId,
        profile_status: 'published',
        approved_by: adminId
      }
    };
  }

  /**
   * Reject a user profile → set profile_status to 'rejected'
   */
  static async rejectProfile(userId, adminId, reason = null) {
    const profile = await UserProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw new Error('Profile not found');

    if (profile.profile_status === 'rejected') {
      throw new Error('Profile is already rejected');
    }

    await profile.update({ profile_status: 'rejected' });

    return {
      success: true,
      message: 'Profile rejected successfully',
      data: {
        user_id: userId,
        profile_status: 'rejected',
        rejected_by: adminId,
        reason: reason || 'No reason provided'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create admin - behaviour depends on who is requesting:
   *   - Super Admin → admin is created directly
   *   - Admin → an AdminRequest is created (pending super_admin approval)
   */
  static async createAdmin(requesterRole, requesterId, adminData) {
    const { email, phone, password } = adminData;

    if (!email && !phone) {
      throw new Error('Either email or phone is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }

    // Check if email/phone already exists
    if (email) {
      const existingUser = await User.findOne({ where: { email, is_deleted: false } });
      if (existingUser) throw new Error('Email already registered');

      const existingRequest = await AdminRequest.findOne({
        where: { email, status: 'pending' }
      });
      if (existingRequest) throw new Error('A pending admin request with this email already exists');
    }

    if (phone) {
      const existingUser = await User.findOne({ where: { phone, is_deleted: false } });
      if (existingUser) throw new Error('Phone number already registered');

      const existingRequest = await AdminRequest.findOne({
        where: { phone, status: 'pending' }
      });
      if (existingRequest) throw new Error('A pending admin request with this phone already exists');
    }

    const saltRounds = 10;
    const password_hash = await bcryptjs.hash(password, saltRounds);

    // Super Admin → create admin directly
    if (requesterRole === 'super_admin') {
      const newAdmin = await User.create({
        email: email || null,
        phone: phone || null,
        password_hash,
        role: 'admin',
        is_deleted: false,
        is_verified: true,
        status: 'active'
      });

      return {
        success: true,
        message: 'Admin created successfully',
        data: {
          id: newAdmin.id,
          email: newAdmin.email,
          phone: newAdmin.phone,
          role: newAdmin.role,
          status: newAdmin.status,
          created_at: newAdmin.created_at
        }
      };
    }

    // Admin → create a pending request for super_admin approval
    const request = await AdminRequest.create({
      requested_by: requesterId,
      email: email || null,
      phone: phone || null,
      password_hash,
      status: 'pending'
    });

    return {
      success: true,
      message: 'Admin creation request submitted. Awaiting super admin approval.',
      data: {
        request_id: request.id,
        email: request.email,
        phone: request.phone,
        status: request.status,
        created_at: request.created_at
      }
    };
  }

  /**
   * Get pending admin creation requests (Super Admin only)
   */
  static async getPendingAdminRequests(pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await AdminRequest.findAndCountAll({
      where: { status: 'pending' },
      include: [
        {
          association: 'RequestedBy',
          attributes: ['id', 'email', 'phone', 'role']
        }
      ],
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'ASC']],
      limit,
      offset
    });

    return {
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        total_pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Approve admin creation request (Super Admin only)
   * Creates the actual admin User record
   */
  static async approveAdminRequest(requestId, superAdminId) {
    const request = await AdminRequest.findByPk(requestId);
    if (!request) throw new Error('Admin request not found');

    if (request.status !== 'pending') {
      throw new Error(`Request has already been ${request.status}`);
    }

    // Double-check email/phone uniqueness before creating
    if (request.email) {
      const existing = await User.findOne({ where: { email: request.email, is_deleted: false } });
      if (existing) throw new Error('Email has been registered since this request was created');
    }
    if (request.phone) {
      const existing = await User.findOne({ where: { phone: request.phone, is_deleted: false } });
      if (existing) throw new Error('Phone has been registered since this request was created');
    }

    // Create the admin user
    const newAdmin = await User.create({
      email: request.email,
      phone: request.phone,
      password_hash: request.password_hash,
      role: 'admin',
      is_deleted: false,
      is_verified: true,
      status: 'active'
    });

    // Update the request
    await request.update({
      status: 'approved',
      reviewed_by: superAdminId,
      reviewed_at: new Date()
    });

    return {
      success: true,
      message: 'Admin request approved. Admin account created successfully.',
      data: {
        request_id: request.id,
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          phone: newAdmin.phone,
          role: newAdmin.role,
          status: newAdmin.status
        },
        approved_by: superAdminId
      }
    };
  }

  /**
   * Reject admin creation request (Super Admin only)
   */
  static async rejectAdminRequest(requestId, superAdminId, reason = null) {
    const request = await AdminRequest.findByPk(requestId);
    if (!request) throw new Error('Admin request not found');

    if (request.status !== 'pending') {
      throw new Error(`Request has already been ${request.status}`);
    }

    await request.update({
      status: 'rejected',
      reviewed_by: superAdminId,
      reviewed_at: new Date(),
      rejection_reason: reason || null
    });

    return {
      success: true,
      message: 'Admin request rejected',
      data: {
        request_id: request.id,
        status: 'rejected',
        rejected_by: superAdminId,
        reason: reason || 'No reason provided'
      }
    };
  }

  /**
   * Get all admins (Super Admin only)
   */
  static async getAllAdmins(requesterRole, requesterId) {
    const where = {
      role: requesterRole === 'super_admin' ? ['admin', 'super_admin'] : 'admin',
      is_deleted: false
    };
    if (requesterRole === 'admin') {
      where.id = { [Op.ne]: requesterId };
    }

    const admins = await User.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: admins
    };
  }

  static async updateAdmin(adminId, changes = {}) {
    const admin = await User.findOne({
      where: { id: adminId, role: 'admin', is_deleted: false }
    });
    if (!admin) throw new Error('Admin not found');

    const allowedFields = ['email', 'phone', 'status'];
    const providedFields = Object.keys(changes);
    if (!providedFields.length || providedFields.some((field) => !allowedFields.includes(field))) {
      throw new Error('Only email, phone, and status can be updated');
    }
    if (changes.status !== undefined && !['active', 'inactive'].includes(changes.status)) {
      throw new Error('Status must be active or inactive');
    }

    const update = {};
    for (const field of ['email', 'phone']) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        const value = changes[field] || null;
        if (value) {
          const existing = await User.findOne({
            where: { [field]: value, id: { [Op.ne]: admin.id }, is_deleted: false }
          });
          if (existing) throw new Error(`${field === 'email' ? 'Email' : 'Phone'} already registered`);
        }
        update[field] = value;
      }
    }

    const email = Object.prototype.hasOwnProperty.call(update, 'email') ? update.email : admin.email;
    const phone = Object.prototype.hasOwnProperty.call(update, 'phone') ? update.phone : admin.phone;
    if (!email && !phone) throw new Error('An admin must have an email or phone number');

    if (changes.status !== undefined) update.status = changes.status;
    await admin.update(update);

    return {
      success: true,
      message: 'Admin updated successfully',
      data: {
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        updated_at: admin.updated_at
      }
    };
  }

  static async deleteAdmin(adminId) {
    const admin = await User.findOne({
      where: { id: adminId, role: 'admin', is_deleted: false }
    });
    if (!admin) throw new Error('Admin not found');

    await admin.update({ is_deleted: true, status: 'inactive' });
    return {
      success: true,
      message: 'Admin deactivated successfully',
      data: { id: admin.id, is_deleted: true, status: admin.status }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get dashboard stats for admin panel
   */
  static async getDashboardStats(userRole) {
    const [
      totalUsers,
      pendingProfiles,
      publishedProfiles,
      rejectedProfiles,
      totalAdmins,
      pendingAdminRequests
    ] = await Promise.all([
      User.count({ where: { role: 'user', is_deleted: false } }),
      UserProfile.count({ where: { profile_status: 'pending' } }),
      UserProfile.count({ where: { profile_status: 'published' } }),
      UserProfile.count({ where: { profile_status: 'rejected' } }),
      User.count({ where: { role: 'admin', is_deleted: false } }),
      AdminRequest.count({ where: { status: 'pending' } })
    ]);

    const stats = {
      total_users: totalUsers,
      profiles: {
        pending: pendingProfiles,
        published: publishedProfiles,
        rejected: rejectedProfiles
      }
    };

    // Only super_admin sees admin-related stats
    if (userRole === 'super_admin') {
      stats.total_admins = totalAdmins;
      stats.pending_admin_requests = pendingAdminRequests;
      stats.total_super_admins = await User.count({
        where: { role: 'super_admin', is_deleted: false }
      });
    }

    return {
      success: true,
      data: stats
    };
  }
}

export default AdminService;
