import { Op } from 'sequelize';
import { User, UserProfile, CareerDetail, UserEducation, UserPhoto } from '../models/index.js';

const baseUrl = process.env.APP_URL || 'http://localhost:3000';

const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

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
  static async searchUsers(filters, pagination) {
    const {
      gender, marital_status, religion, caste, mother_tongue,
      country, state, city,
      min_age, max_age,
      min_height, max_height,
      education_level,
      work_type, min_income, max_income,
      has_photo,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const profileWhere = {};
    if (gender) profileWhere.gender = gender;
    if (marital_status) profileWhere.marital_status = Array.isArray(marital_status) ? { [Op.in]: marital_status } : marital_status;
    if (religion) profileWhere.religion = { [Op.like]: `%${religion}%` };
    if (caste) profileWhere.caste = { [Op.like]: `%${caste}%` };
    if (mother_tongue) profileWhere.mother_tongue = { [Op.like]: `%${mother_tongue}%` };
    if (country) profileWhere.country = { [Op.like]: `%${country}%` };
    if (state) profileWhere.state = { [Op.like]: `%${state}%` };
    if (city) profileWhere.city = { [Op.like]: `%${city}%` };

    if (min_height || max_height) {
      profileWhere.height_cm = {};
      if (min_height) profileWhere.height_cm[Op.gte] = parseInt(min_height);
      if (max_height) profileWhere.height_cm[Op.lte] = parseInt(max_height);
    }

    if (min_age || max_age) {
      const today = new Date();
      profileWhere.date_of_birth = {};
      if (min_age) profileWhere.date_of_birth[Op.lte] = new Date(today.getFullYear() - parseInt(min_age), today.getMonth(), today.getDate());
      if (max_age) profileWhere.date_of_birth[Op.gte] = new Date(today.getFullYear() - parseInt(max_age), today.getMonth(), today.getDate());
    }

    const careerWhere = {};
    if (work_type) careerWhere.work_type = Array.isArray(work_type) ? { [Op.in]: work_type } : work_type;
    if (min_income || max_income) {
      careerWhere.annual_income = {};
      if (min_income) careerWhere.annual_income[Op.gte] = String(min_income);
      if (max_income) careerWhere.annual_income[Op.lte] = String(max_income);
    }

    const educationWhere = {};
    if (education_level) educationWhere.education_level = Array.isArray(education_level) ? { [Op.in]: education_level } : education_level;

    const sortMap = {
      created_at: [User, 'created_at'],
      age: [UserProfile, 'date_of_birth'],
      height: [UserProfile, 'height_cm']
    };
    const orderField = sortMap[sort_by] || sortMap['created_at'];

    const { count, rows } = await User.findAndCountAll({
      where: { is_deleted: false, status: 'active' },
      include: [
        { model: UserProfile, where: profileWhere, required: true },
        {
          model: CareerDetail,
          where: Object.keys(careerWhere).length ? careerWhere : undefined,
          required: Object.keys(careerWhere).length > 0,
          attributes: ['work_type', 'occupation', 'company_name', 'business_name', 'annual_income', 'is_primary']
        },
        {
          model: UserEducation,
          where: Object.keys(educationWhere).length ? educationWhere : undefined,
          required: Object.keys(educationWhere).length > 0,
          attributes: ['education_level', 'degree', 'field_of_study', 'institution', 'is_highest']
        },
        {
          model: UserPhoto,
          where: { is_primary: true },
          required: has_photo === 'true',
          attributes: ['photo_url', 'is_primary']
        }
      ],
      order: [[...orderField, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const users = rows.map(user => {
      const profile = user.UserProfile;
      const primaryPhoto = user.UserPhotos?.find(p => p.is_primary);
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        profile: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          gender: profile.gender,
          age: profile.date_of_birth ? calculateAge(profile.date_of_birth) : null,
          height_cm: profile.height_cm,
          marital_status: profile.marital_status,
          religion: profile.religion,
          caste: profile.caste,
          mother_tongue: profile.mother_tongue,
          country: profile.country,
          state: profile.state,
          city: profile.city,
          bio: profile.bio
        },
        primary_photo: primaryPhoto ? `${baseUrl}/${primaryPhoto.photo_url}` : null,
        career: user.CareerDetails?.filter(c => c.is_primary).map(c => ({
          work_type: c.work_type,
          occupation: c.occupation,
          company_name: c.company_name,
          business_name: c.business_name,
          annual_income: c.annual_income
        })),
        education: user.UserEducations?.filter(e => e.is_highest).map(e => ({
          education_level: e.education_level,
          degree: e.degree,
          field_of_study: e.field_of_study,
          institution: e.institution
        }))
      };
    });

    return {
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(count / limit)
      }
    };
  }

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
