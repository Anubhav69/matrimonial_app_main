import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log('ENV CHECK:', {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  db: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
});

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
