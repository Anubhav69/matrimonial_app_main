import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  receiver_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

User.hasMany(Message, { foreignKey: 'sender_id', as: 'SentMessages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'ReceivedMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'Receiver' });

export default Message;
