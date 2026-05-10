import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const UserInteraction = sequelize.define('UserInteraction', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    references: { model: 'users', key: 'id' },
  },
  receiver_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    references: { model: 'users', key: 'id' },
  },
  type: {
    type: DataTypes.ENUM('interest', 'accepted', 'rejected', 'blocked'),
    allowNull: false,
  },
}, {
  tableName: 'user_interactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

User.hasMany(UserInteraction, { foreignKey: 'sender_id', as: 'SentInteractions' });
User.hasMany(UserInteraction, { foreignKey: 'receiver_id', as: 'ReceivedInteractions' });
UserInteraction.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
UserInteraction.belongsTo(User, { foreignKey: 'receiver_id', as: 'Receiver' });

export default UserInteraction;
