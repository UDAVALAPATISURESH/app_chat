/**
 * ArchivedChat Model (Sequelize)
 * Defines the ArchivedChat model for archived chat messages
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// Define ArchivedChat model
const ArchivedChat = sequelize.define('ArchivedChat', {
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
    allowNull: false
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
    allowNull: false
  },
  archivedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'archived_chats',
  timestamps: false,
  indexes: [
    { fields: ['roomId', 'timestamp'] },
    { fields: ['timestamp'] }
  ]
});

// Associations are defined in models/index.js to avoid duplicates

module.exports = ArchivedChat;
