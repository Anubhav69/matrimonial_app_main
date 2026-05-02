import sequelize from '../config/database.js';
import User from './User.js';
import UserProfile from './UserProfile.js';
import CareerDetail from './CareerDetail.js';
import UserEducation from './UserEducation.js';
import UserPhoto from './UserPhoto.js';

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('Database connection established.');
  const [[{ DATA_TYPE, COLUMN_TYPE }]] = await sequelize.query(
    `SELECT DATA_TYPE, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'`
  );
  if (DATA_TYPE === 'bigint' && !COLUMN_TYPE.includes('unsigned')) {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('ALTER TABLE users MODIFY id BIGINT UNSIGNED AUTO_INCREMENT');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Migrated users.id to BIGINT UNSIGNED.');
  }
  await sequelize.sync();
  console.log('Database synced.');
};

export { sequelize, connectDB, User, UserProfile, CareerDetail, UserEducation, UserPhoto };
