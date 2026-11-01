import { UserProfile, User, CareerDetail, UserEducation } from '../models/index.js';
import { validateProfileData, validateCareerDetails, validateUserEducation } from '../validators/profileValidator.js';
import { sequelize } from '../models/index.js';

/**
 * UserProfileService - Handles user profile logic
 */
class UserProfileService {
  /**
   * Create user profile
   * New profiles start with profile_status = 'pending'
   */
  static async createProfile(userId, profileData) {
    const { career_details = [], user_education = [], ...profileFields } = profileData;

    validateProfileData(profileFields);
    if (!profileFields.gotra?.trim()) throw new Error('Gotra is required');
    validateCareerDetails(career_details);
    validateUserEducation(user_education);

    const user = await User.findOne({ where: { id: userId, is_deleted: false } });
    if (!user) throw new Error('User not found');

    const existingProfile = await UserProfile.findOne({ where: { user_id: userId } });
    if (existingProfile) throw new Error('Profile already exists for this user');

    const result = await sequelize.transaction(async (t) => {
      const profile = await UserProfile.create(
        { user_id: userId, ...profileFields, profile_status: 'pending' },
        { transaction: t }
      );

      let careers = [];
      if (career_details.length > 0) {
        careers = await CareerDetail.bulkCreate(
          career_details.map(c => ({ ...c, user_id: userId })),
          { transaction: t }
        );
      }

      let educations = [];
      if (user_education.length > 0) {
        educations = await UserEducation.bulkCreate(
          user_education.map(e => ({ ...e, user_id: userId })),
          { transaction: t }
        );
      }

      return { profile, careers, educations };
    });

    return {
      success: true,
      message: 'Profile created successfully. It is pending admin approval.',
      data: {
        profile: result.profile,
        career_details: result.careers,
        user_education: result.educations
      }
    };
  }

  /**
   * Get user profile by user ID
   * 
   * @param {number} userId - ID of the profile to fetch
   * @param {object} requestingUser - The authenticated user making the request (from req.user)
   */
  static async getProfileByUserId(userId, requestingUser = null) {
    const user = await User.findOne({
      where: { id: userId, is_deleted: false },
      attributes: ['id', 'email', 'phone', 'role', 'status'],
      include: [
        { model: UserProfile },
        { model: CareerDetail },
        { model: UserEducation }
      ]
    });

    if (!user || !user.UserProfile) throw new Error('Profile not found');

    // If a regular user is viewing someone else's profile,
    // only allow viewing if the profile is published
    if (requestingUser && requestingUser.role === 'user') {
      const isOwnProfile = String(requestingUser.id) === String(userId);
      if (!isOwnProfile && user.UserProfile.profile_status !== 'published') {
        throw new Error('Profile not found');
      }
    }

    return {
      user_id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile: user.UserProfile,
      career_details: user.CareerDetails,
      user_education: user.UserEducations
    };
  }

  /**
   * Update user profile
   * If profile was rejected, updating it resets status to 'pending' for re-review
   */
  static async updateProfile(userId, profileData) {
    const { career_details, user_education, ...profileFields } = profileData;

    validateProfileData(profileFields);
    if (career_details) validateCareerDetails(career_details);
    if (user_education) validateUserEducation(user_education);

    const profile = await UserProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw new Error('Profile not found');

    // If profile was rejected, reset to pending on update so admin can re-review
    const updateFields = { ...profileFields };
    if (profile.profile_status === 'rejected') {
      updateFields.profile_status = 'pending';
    }

    const result = await sequelize.transaction(async (t) => {
      await profile.update(updateFields, { transaction: t });

      let careers = [];
      if (career_details) {
        const toUpdate = career_details.filter(c => c.id);
        const toCreate = career_details.filter(c => !c.id);

        for (const career of toUpdate) {
          const existing = await CareerDetail.findOne({ where: { id: career.id, user_id: userId } });
          if (existing) await existing.update(career, { transaction: t });
        }

        if (toCreate.length > 0) {
          await CareerDetail.bulkCreate(
            toCreate.map(c => ({ ...c, user_id: userId })),
            { transaction: t }
          );
        }

        careers = await CareerDetail.findAll({ where: { user_id: userId }, transaction: t });
      }

      let educations = [];
      if (user_education) {
        const toUpdate = user_education.filter(e => e.id);
        const toCreate = user_education.filter(e => !e.id);

        for (const edu of toUpdate) {
          const existing = await UserEducation.findOne({ where: { id: edu.id, user_id: userId } });
          if (existing) await existing.update(edu, { transaction: t });
        }

        if (toCreate.length > 0) {
          await UserEducation.bulkCreate(
            toCreate.map(e => ({ ...e, user_id: userId })),
            { transaction: t }
          );
        }

        educations = await UserEducation.findAll({ where: { user_id: userId }, transaction: t });
      }

      return { profile, careers, educations };
    });

    return {
      success: true,
      message: profile.profile_status === 'pending' && profileData.profile_status !== 'pending'
        ? 'Profile updated successfully. It has been resubmitted for admin approval.'
        : 'Profile updated successfully',
      data: {
        profile: result.profile,
        ...(career_details && { career_details: result.careers }),
        ...(user_education && { user_education: result.educations })
      }
    };
  }

  /**
   * Delete user profile
   */
  static async deleteProfile(userId) {
    const profile = await UserProfile.findOne({ where: { user_id: userId } });

    if (!profile) {
      throw new Error('Profile not found');
    }

    await profile.destroy();

    return {
      success: true,
      message: 'Profile deleted successfully'
    };
  }
}

export default UserProfileService;
