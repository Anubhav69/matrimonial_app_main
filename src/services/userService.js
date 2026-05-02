import { User } from '../models/index.js';

/**
 * UserService - Handles user management logic
 */
class UserService {
  /**
   * Get all users from database
   */
  static async getAllUsers() {
    return await User.findAll({
      where: { is_deleted: false },
      attributes: { exclude: ['password_hash'] }
    });
  }

  /**
   * Get user by ID from database
   */
  static async getUserById(id) {
    return await User.findOne({
      where: { id, is_deleted: false },
      attributes: { exclude: ['password_hash'] }
    });
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(id) {
    const user = await User.findOne({
      where: { id, is_deleted: false }
    });

    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ is_deleted: true });

    return {
      success: true,
      message: 'User deleted successfully'
    };
  }
}

export default UserService;
