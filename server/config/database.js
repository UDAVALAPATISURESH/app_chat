/**
 * Sequelize Database Connection
 * Handles connection to MySQL database using Sequelize ORM
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'chatapp',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
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

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('MySQL connected successfully via Sequelize');
  })
  .catch(err => {
    console.error('MySQL connection error:', err);
  });

module.exports = sequelize;
