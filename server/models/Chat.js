/**
 * Chat Model (Sequelize)
 * Defines the Chat model and handles all database operations for chat messages
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// Define Chat model
const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: User,
      key: 'id'
    }
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  message: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'file'),
    defaultValue: 'text'
  },
  mediaUrl: {
    type: DataTypes.STRING(500),
    defaultValue: ''
  },
  roomId: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chats',
  timestamps: false,
  indexes: [
    { fields: ['roomId', 'timestamp'] },
    { fields: ['timestamp'] },
    { fields: ['senderId'] },
    { fields: ['receiverId'] },
    { fields: ['groupId'] }
  ]
});

// Associations are defined in models/index.js to avoid duplicates

module.exports = Chat;
