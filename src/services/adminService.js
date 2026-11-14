import bcryptjs from 'bcryptjs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { Op } from 'sequelize';
import { sequelize, User, UserProfile, CareerDetail, UserEducation, UserPhoto, UserInteraction, Message } from '../models/index.js';
import AdminRequest from '../models/AdminRequest.js';
import { validateEmail, validatePhone, validatePassword } from '../validators/authValidator.js';

function normalizeAdminContact(data, requireContact = true) {
  const emailInput = data.email ?? '';
  const phoneInput = data.phone ?? '';
  if (typeof emailInput !== 'string' || typeof phoneInput !== 'string') {
    throw new Error('Email and phone must be strings');
  }
  const email = emailInput.trim().toLowerCase() || null;
  const phone = phoneInput.trim() || null;
  if (requireContact && !email && !phone) {
    throw new Error('Either email or phone is required');
  }
  validateEmail(email);
  validatePhone(phone);
  return { email, phone };
}

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

    const accountStatus = filters.accountStatus || 'active';
    if (!['active', 'deleted', 'all'].includes(accountStatus)) {
      throw new Error('Invalid account status filter');
    }

    const userWhere = { role: 'user' };
    if (accountStatus !== 'all') {
      userWhere.is_deleted = accountStatus === 'deleted';
    }
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

  static async updateUser(userId, changes) {
    const user = await User.findOne({ where: { id: userId, role: 'user' } });
    if (!user) throw new Error('User not found');
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new Error('Invalid user details');
    }

    const allowedFields = new Set([
      'email', 'phone', 'first_name', 'last_name', 'gender', 'date_of_birth',
      'birth_time', 'birth_place', 'gotra', 'height_cm', 'marital_status',
      'religion', 'caste', 'mother_tongue', 'country', 'state', 'city', 'bio'
    ]);
    if (!Object.keys(changes).length) throw new Error('No user details were provided');
    if (Object.keys(changes).some((field) => !allowedFields.has(field))) {
      throw new Error('Invalid user detail field');
    }

    const userUpdates = {};
    for (const field of ['email', 'phone']) {
      if (!Object.prototype.hasOwnProperty.call(changes, field)) continue;
      const rawValue = changes[field];
      if (rawValue !== null && typeof rawValue !== 'string') {
        throw new Error(`Invalid ${field}`);
      }

      const trimmedValue = rawValue?.trim() || null;
      const value = field === 'email' && trimmedValue ? trimmedValue.toLowerCase() : trimmedValue;
      if (value && value.length > (field === 'email' ? 255 : 20)) {
        throw new Error(`Invalid ${field}`);
      }
      if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('Invalid email');
      }
      if (value) {
        const existing = await User.findOne({
          where: { [field]: value, id: { [Op.ne]: user.id } }
        });
        if (existing) throw new Error(`${field === 'email' ? 'Email' : 'Phone'} already registered`);
      }
      userUpdates[field] = value;
    }

    const email = Object.prototype.hasOwnProperty.call(userUpdates, 'email') ? userUpdates.email : user.email;
    const phone = Object.prototype.hasOwnProperty.call(userUpdates, 'phone') ? userUpdates.phone : user.phone;
    if (!email && !phone) throw new Error('A user must have an email or phone number');

    const profile = await UserProfile.findOne({ where: { user_id: user.id } });
    if (!profile) throw new Error('Profile not found');

    const profileUpdates = {};
    const textFieldLengths = {
      first_name: 100,
      last_name: 100,
      gender: 10,
      date_of_birth: 10,
      birth_time: 5,
      birth_place: 100,
      gotra: 100,
      marital_status: 20,
      religion: 100,
      caste: 100,
      mother_tongue: 100,
      country: 100,
      state: 100,
      city: 100
    };
    for (const [field, maxLength] of Object.entries(textFieldLengths)) {
      if (!Object.prototype.hasOwnProperty.call(changes, field)) continue;
      const value = changes[field];
      if (value !== null && typeof value !== 'string') throw new Error(`Invalid ${field}`);
      const trimmedValue = value?.trim() || null;
      if (trimmedValue && trimmedValue.length > maxLength) throw new Error(`Invalid ${field}`);
      profileUpdates[field] = trimmedValue;
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'bio')) {
      const value = changes.bio;
      if (value !== null && typeof value !== 'string') throw new Error('Invalid bio');
      if (value && value.length > 65535) throw new Error('Invalid bio');
      profileUpdates.bio = value?.trim() || null;
    }

    const enumValues = {
      gender: ['male', 'female', 'other'],
      marital_status: ['unmarried', 'divorced', 'widowed']
    };
    for (const [field, values] of Object.entries(enumValues)) {
      if (profileUpdates[field] && !values.includes(profileUpdates[field])) {
        throw new Error(`Invalid ${field}`);
      }
    }
    if (profileUpdates.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(profileUpdates.date_of_birth)) {
      throw new Error('Invalid date_of_birth');
    }
    if (profileUpdates.date_of_birth) {
      const parsedDate = new Date(`${profileUpdates.date_of_birth}T00:00:00.000Z`);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== profileUpdates.date_of_birth) {
        throw new Error('Invalid date_of_birth');
      }
    }
    if (profileUpdates.birth_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(profileUpdates.birth_time)) {
      throw new Error('Invalid birth_time');
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'height_cm')) {
      const value = changes.height_cm;
      const height = value === '' || value === null ? null : Number(value);
      if (height !== null && (!Number.isInteger(height) || height < 1 || height > 300)) {
        throw new Error('Invalid height_cm');
      }
      profileUpdates.height_cm = height;
    }

    await sequelize.transaction(async (transaction) => {
      if (Object.keys(userUpdates).length) await user.update(userUpdates, { transaction });
      if (Object.keys(profileUpdates).length) await profile.update(profileUpdates, { transaction });
    });

    return {
      success: true,
      message: 'User details updated successfully',
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        is_deleted: user.is_deleted,
        profile: profile.toJSON()
      }
    };
  }

  static async softDeleteUser(userId) {
    const user = await User.findOne({ where: { id: userId, role: 'user', is_deleted: false } });
    if (!user) throw new Error('Active user not found');

    await user.update({ is_deleted: true });
    return {
      success: true,
      message: 'User deactivated successfully',
      data: { id: user.id, is_deleted: true, status: user.status }
    };
  }

  static async restoreUser(userId) {
    const user = await User.findOne({ where: { id: userId, role: 'user', is_deleted: true } });
    if (!user) throw new Error('Deleted user not found');

    await user.update({ is_deleted: false });
    return {
      success: true,
      message: 'User restored successfully',
      data: { id: user.id, is_deleted: false, status: user.status }
    };
  }

  static async hardDeleteUser(userId) {
    const user = await User.findOne({ where: { id: userId, role: 'user' } });
    if (!user) throw new Error('User not found');
    const [profile, photos] = await Promise.all([
      UserProfile.findOne({ where: { user_id: user.id }, attributes: ['profile_photo'] }),
      UserPhoto.findAll({ where: { user_id: user.id }, attributes: ['photo_url'] })
    ]);

    await sequelize.transaction(async (transaction) => {
      await UserInteraction.destroy({
        where: { [Op.or]: [{ sender_id: user.id }, { receiver_id: user.id }] },
        transaction
      });
      await Message.destroy({
        where: { [Op.or]: [{ sender_id: user.id }, { receiver_id: user.id }] },
        transaction
      });
      await UserProfile.destroy({ where: { user_id: user.id }, transaction });
      await CareerDetail.destroy({ where: { user_id: user.id }, transaction });
      await UserEducation.destroy({ where: { user_id: user.id }, transaction });
      await UserPhoto.destroy({ where: { user_id: user.id }, transaction });
      await user.destroy({ transaction });
    });

    const uploadDirectory = path.resolve(process.cwd(), 'uploads');
    const filePaths = new Set([profile?.profile_photo, ...photos.map((photo) => photo.photo_url)]);
    for (const storedPath of filePaths) {
      if (typeof storedPath !== 'string' || !storedPath) continue;
      const filePath = path.resolve(storedPath);
      const relativePath = path.relative(uploadDirectory, filePath);
      if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) continue;
      try {
        await unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw new Error(`User was deleted, but an uploaded photo could not be removed: ${error.message}`);
        }
      }
    }

    return {
      success: true,
      message: 'User and associated records permanently deleted',
      data: { id: user.id }
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
    const { email, phone } = normalizeAdminContact(adminData);
    const { password } = adminData;

    validatePassword(password);

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

    const contactChanges = normalizeAdminContact(changes, false);
    const update = {};
    for (const field of ['email', 'phone']) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        const value = contactChanges[field];
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

  static async updateAdminProfile(adminId, changes = {}) {
    const admin = await User.findOne({
      where: { id: adminId, role: { [Op.in]: ['admin', 'super_admin'] }, is_deleted: false }
    });
    if (!admin) throw new Error('Admin not found');

    const fields = ['email', 'phone'];
    const providedFields = Object.keys(changes);
    if (!providedFields.length || providedFields.some((field) => !fields.includes(field))) {
      throw new Error('Only email and phone can be updated');
    }

    const contactChanges = normalizeAdminContact(changes, false);
    const update = {};
    for (const field of fields) {
      if (!Object.prototype.hasOwnProperty.call(changes, field)) continue;
      const value = contactChanges[field];
      if (value) {
        const existing = await User.findOne({ where: { [field]: value, id: { [Op.ne]: admin.id } } });
        if (existing) throw new Error(`${field === 'email' ? 'Email' : 'Phone'} already registered`);
      }
      update[field] = value;
    }

    const email = Object.prototype.hasOwnProperty.call(update, 'email') ? update.email : admin.email;
    const phone = Object.prototype.hasOwnProperty.call(update, 'phone') ? update.phone : admin.phone;
    if (!email && !phone) throw new Error('An admin must have an email or phone number');

    await admin.update(update);
    return {
      success: true,
      message: 'Your profile was updated successfully',
      data: {
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status
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
