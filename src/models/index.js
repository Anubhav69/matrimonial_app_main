import sequelize from '../config/database.js';
import User from './User.js';
import UserProfile from './UserProfile.js';
import CareerDetail from './CareerDetail.js';
import UserEducation from './UserEducation.js';
import UserPhoto from './UserPhoto.js';
import UserInteraction from './UserInteraction.js';
import Message from './Message.js';

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('Database connection established.');
  await sequelize.sync();
  console.log('Database synced.');
};

export { sequelize, connectDB, User, UserProfile, CareerDetail, UserEducation, UserPhoto, UserInteraction, Message };
