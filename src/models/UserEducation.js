import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const UserEducation = sequelize.define('UserEducation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  education_level: DataTypes.ENUM('high_school', 'diploma', 'bachelors', 'masters', 'phd', 'other'),
  degree: DataTypes.STRING(255),
  field_of_study: DataTypes.STRING(255),
  institution: DataTypes.STRING(255),
  start_year: DataTypes.INTEGER,
  end_year: DataTypes.INTEGER,
  is_highest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'user_education',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

User.hasMany(UserEducation, { foreignKey: 'user_id' });
UserEducation.belongsTo(User, { foreignKey: 'user_id' });

export default UserEducation;
