import { UserProfile, UserPhoto } from '../models/index.js';

const requiredFields = [
  'first_name',
  'last_name',
  'gender',
  'date_of_birth',
  'height_cm',
  'marital_status',
  'religion',
  'country',
  'state',
  'city'
];

const isCompleteProfile = async (userId) => {
  const [profile, primaryPhoto] = await Promise.all([
    UserProfile.findOne({ where: { user_id: userId } }),
    UserPhoto.findOne({ where: { user_id: userId, is_primary: true } })
  ]);

  return Boolean(
    profile &&
    requiredFields.every((field) => String(profile[field] || '').trim()) &&
    primaryPhoto
  );
};

const requireCompleteProfile = async (req, res, next) => {
  try {
    const complete = await isCompleteProfile(req.user.id);
    if (!complete) {
      return res.status(403).json({
        success: false,
        message: 'Complete your profile first',
        error: 'Complete profile details and upload a primary photo before viewing profiles or sending requests'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const requireCompleteProfileForOtherUser = async (req, res, next) => {
  if (String(req.params.userId) === String(req.user.id)) return next();
  return requireCompleteProfile(req, res, next);
};

export { isCompleteProfile, requireCompleteProfile, requireCompleteProfileForOtherUser };
