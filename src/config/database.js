import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

console.log('ENV CHECK:', {
  host: process.env.MYSQL_HOST ?? process.env.DB_HOST,
  user: process.env.MYSQL_USER ?? process.env.DB_USER,
  db: process.env.MYSQL_DATABASE ?? process.env.DB_NAME,
});

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE ?? process.env.DB_NAME,
  process.env.MYSQL_USER ?? process.env.DB_USER,
  process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD,
  {
    host: process.env.MYSQL_HOST ?? process.env.DB_HOST ?? 'localhost',
    port: process.env.MYSQL_PORT ?? process.env.DB_PORT ?? 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

console.log('ENV CHECK:', {
  host: process.env.MYSQL_HOST ?? process.env.DB_HOST,
  user: process.env.MYSQL_USER ?? process.env.DB_USER,
  db: process.env.MYSQL_DATABASE ?? process.env.DB_NAME,
});

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE ?? process.env.DB_NAME,
  process.env.MYSQL_USER ?? process.env.DB_USER,
  process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD,
  {
    host: process.env.MYSQL_HOST ?? process.env.DB_HOST ?? 'localhost',
    port: process.env.MYSQL_PORT ?? process.env.DB_PORT ?? 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
