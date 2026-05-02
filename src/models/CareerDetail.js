import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const CareerDetail = sequelize.define('CareerDetail', {
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
  work_type: {
    type: DataTypes.ENUM('job', 'business', 'freelance', 'other'),
    allowNull: false,
  },
  occupation: DataTypes.STRING(255),
  company_name: DataTypes.STRING(255),
  business_name: DataTypes.STRING(255),
  annual_income: DataTypes.STRING(100),
  experience_years: DataTypes.INTEGER,
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'career_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

User.hasMany(CareerDetail, { foreignKey: 'user_id' });
CareerDetail.belongsTo(User, { foreignKey: 'user_id' });

export default CareerDetail;
