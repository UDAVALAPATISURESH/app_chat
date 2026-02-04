/**
 * User Model (Sequelize)
 * Defines the User model and handles all database operations
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    trim: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    trim: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  avatar: {
    type: DataTypes.STRING(500),
    defaultValue: ''
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  updatedAt: false
});

module.exports = User;
