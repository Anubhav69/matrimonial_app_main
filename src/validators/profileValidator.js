/**
 * Profile Validators
 * Validation functions for user profile data
 */

export const validateDateOfBirth = (dob) => {
  if (!dob) return { isValid: true };

  const birthDate = new Date(dob);
  const today = new Date();
  
  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Age should be between 18 and 90
  if (age < 18) {
    throw new Error('User must be at least 18 years old');
  }

  if (age > 90) {
    throw new Error('Age cannot exceed 90 years');
  }

  // Date should not be in future
  if (birthDate > today) {
    throw new Error('Date of birth cannot be in the future');
  }

  return { isValid: true };
};

export const validateHeight = (height) => {
  if (!height) return { isValid: true };

  // Height should be between 100cm (3'3") and 250cm (8'2")
  if (height < 100) {
    throw new Error('Height must be at least 100 cm');
  }

  if (height > 250) {
    throw new Error('Height cannot exceed 250 cm');
  }

  return { isValid: true };
};

export const validateBio = (bio) => {
  if (!bio) return { isValid: true };

  // Count words
  const wordCount = bio.trim().split(/\s+/).length;

  if (wordCount > 500) {
    throw new Error('Bio cannot exceed 500 words');
  }

  // Character limit
  if (bio.length > 2000) {
    throw new Error('Bio cannot exceed 2000 characters');
  }

  return { isValid: true };
};

export const validateGender = (gender) => {
  if (!gender) return { isValid: true };

  const validGenders = ['male', 'female', 'other'];
  if (!validGenders.includes(gender)) {
    throw new Error('Gender must be male, female, or other');
  }

  return { isValid: true };
};

export const validateMaritalStatus = (status) => {
  if (!status) return { isValid: true };

  const validStatuses = ['unmarried', 'divorced', 'widowed'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid marital status');
  }

  return { isValid: true };
};

export const validateName = (name, fieldName) => {
  if (!name) return { isValid: true };

  if (name.length < 2) {
    throw new Error(`${fieldName} must be at least 2 characters long`);
  }

  if (name.length > 100) {
    throw new Error(`${fieldName} cannot exceed 100 characters`);
  }

  // Only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    throw new Error(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }

  return { isValid: true };
};

export const validateCareerDetails = (careers) => {
  if (!Array.isArray(careers)) throw new Error('career_details must be an array');

  const validWorkTypes = ['job', 'business', 'freelance', 'other'];

  careers.forEach((career, i) => {
    const label = `career_details[${i}]`;

    if (!career.work_type) throw new Error(`${label}.work_type is required`);
    if (!validWorkTypes.includes(career.work_type))
      throw new Error(`${label}.work_type must be one of: ${validWorkTypes.join(', ')}`);

    if (career.occupation && career.occupation.length > 255)
      throw new Error(`${label}.occupation cannot exceed 255 characters`);

    if (career.company_name && career.company_name.length > 255)
      throw new Error(`${label}.company_name cannot exceed 255 characters`);

    if (career.business_name && career.business_name.length > 255)
      throw new Error(`${label}.business_name cannot exceed 255 characters`);

    if (career.experience_years !== undefined) {
      if (!Number.isInteger(career.experience_years) || career.experience_years < 0)
        throw new Error(`${label}.experience_years must be a non-negative integer`);
      if (career.experience_years > 60)
        throw new Error(`${label}.experience_years cannot exceed 60`);
    }

    if (career.is_primary !== undefined && typeof career.is_primary !== 'boolean')
      throw new Error(`${label}.is_primary must be a boolean`);
  });

  // Only one entry can be primary
  const primaryCount = careers.filter(c => c.is_primary === true).length;
  if (primaryCount > 1) throw new Error('Only one career entry can be marked as primary');

  return { isValid: true };
};

export const validateUserEducation = (educations) => {
  if (!Array.isArray(educations)) throw new Error('user_education must be an array');

  const validLevels = ['high_school', 'diploma', 'bachelors', 'masters', 'phd', 'other'];
  const currentYear = new Date().getFullYear();

  educations.forEach((edu, i) => {
    const label = `user_education[${i}]`;

    if (edu.education_level && !validLevels.includes(edu.education_level))
      throw new Error(`${label}.education_level must be one of: ${validLevels.join(', ')}`);

    if (edu.degree && edu.degree.length > 255)
      throw new Error(`${label}.degree cannot exceed 255 characters`);

    if (edu.field_of_study && edu.field_of_study.length > 255)
      throw new Error(`${label}.field_of_study cannot exceed 255 characters`);

    if (edu.institution && edu.institution.length > 255)
      throw new Error(`${label}.institution cannot exceed 255 characters`);

    if (edu.start_year !== undefined) {
      if (edu.start_year < 1950 || edu.start_year > currentYear)
        throw new Error(`${label}.start_year must be between 1950 and ${currentYear}`);
    }

    if (edu.end_year !== undefined) {
      if (edu.end_year < 1950 || edu.end_year > currentYear + 10)
        throw new Error(`${label}.end_year must be between 1950 and ${currentYear + 10}`);
      if (edu.start_year && edu.end_year < edu.start_year)
        throw new Error(`${label}.end_year cannot be before start_year`);
    }

    if (edu.is_highest !== undefined && typeof edu.is_highest !== 'boolean')
      throw new Error(`${label}.is_highest must be a boolean`);
  });

  // Only one entry can be marked as highest
  const highestCount = educations.filter(e => e.is_highest === true).length;
  if (highestCount > 1) throw new Error('Only one education entry can be marked as highest');

  return { isValid: true };
};

export const validateProfileData = (profileData) => {
  const {
    first_name,
    last_name,
    gender,
    date_of_birth,
    height_cm,
    marital_status,
    bio
  } = profileData;

  // Validate each field
  if (first_name) validateName(first_name, 'First name');
  if (last_name) validateName(last_name, 'Last name');
  if (gender) validateGender(gender);
  if (date_of_birth) validateDateOfBirth(date_of_birth);
  if (height_cm) validateHeight(height_cm);
  if (marital_status) validateMaritalStatus(marital_status);
  if (bio) validateBio(bio);

  return { isValid: true };
};
