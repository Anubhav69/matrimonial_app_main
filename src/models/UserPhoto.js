import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const UserPhoto = sequelize.define('UserPhoto', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    references: { model: 'users', key: 'id' },
  },
  photo_url: DataTypes.STRING(255),
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'user_photos',
  timestamps: true,
  createdAt: 'uploaded_at',
  updatedAt: false,
});

User.hasMany(UserPhoto, { foreignKey: 'user_id' });
UserPhoto.belongsTo(User, { foreignKey: 'user_id' });

export default UserPhoto;
