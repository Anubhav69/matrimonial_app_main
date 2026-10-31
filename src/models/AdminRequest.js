import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const AdminRequest = sequelize.define('AdminRequest', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  requested_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    comment: 'Admin user who requested the new admin creation',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  reviewed_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'Super admin who approved/rejected',
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'admin_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Associations
User.hasMany(AdminRequest, { foreignKey: 'requested_by', as: 'AdminRequestsMade' });
AdminRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'RequestedBy' });

User.hasMany(AdminRequest, { foreignKey: 'reviewed_by', as: 'AdminRequestsReviewed' });
AdminRequest.belongsTo(User, { foreignKey: 'reviewed_by', as: 'ReviewedBy' });

export default AdminRequest;

