import UserProfileService from '../services/userProfileService.js';

/**
 * UserProfileController - Handles user profile requests
 */

/**
 * Create user profile
 */
const createProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    const result = await UserProfileService.createProfile(userId, profileData);
    res.status(201).json(result);
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 
                       error.message === 'Profile already exists for this user' ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create profile',
      error: error.message
    });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await UserProfileService.getProfileByUserId(userId);

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: profile
    });
  } catch (error) {
    const statusCode = error.message === 'Profile not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    const result = await UserProfileService.updateProfile(userId, profileData);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Profile not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Delete user profile
 */
const deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserProfileService.deleteProfile(userId);

    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Profile not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete profile',
      error: error.message
    });
  }
};

export { createProfile, getProfile, updateProfile, deleteProfile };
