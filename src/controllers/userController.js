import UserService from '../services/userService.js';

/**
 * UserController - Handles user management requests
 */

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UserService.deleteUser(id);
    
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { page, limit, sort_by, sort_order, ...filters } = req.query;
    const result = await UserService.searchUsers(
      { ...filters, sort_by, sort_order },
      { page, limit },
      req.user.id
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { getAllUsers, getUserById, deleteUser, searchUsers };
