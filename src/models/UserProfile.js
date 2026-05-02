import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    references: { model: 'users', key: 'id' },
  },
  first_name: DataTypes.STRING(100),
  last_name: DataTypes.STRING(100),
  gender: DataTypes.ENUM('male', 'female', 'other'),
  date_of_birth: DataTypes.DATEONLY,
  height_cm: DataTypes.INTEGER,
  marital_status: DataTypes.ENUM('unmarried', 'divorced', 'widowed'),
  religion: DataTypes.STRING(100),
  caste: DataTypes.STRING(100),
  mother_tongue: DataTypes.STRING(100),
  country: DataTypes.STRING(100),
  state: DataTypes.STRING(100),
  city: DataTypes.STRING(100),
  bio: DataTypes.TEXT,
  profile_photo: DataTypes.STRING(255),
}, {
  tableName: 'user_profiles',
  timestamps: false,
});

User.hasOne(UserProfile, { foreignKey: 'user_id' });
UserProfile.belongsTo(User, { foreignKey: 'user_id' });

export default UserProfile;
