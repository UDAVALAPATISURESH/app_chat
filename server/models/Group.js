/**
 * Group Model (Sequelize)
 * Defines the Group model and handles all database operations for groups
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// Define Group model
const Group = sequelize.define('Group', {
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
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
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
  tableName: 'groups',
  timestamps: false,
  indexes: [
    { fields: ['adminId'] }
  ]
});

// Define GroupMember junction table for many-to-many relationship
const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Group,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_members',
  timestamps: false,
  indexes: [
    { fields: ['groupId'] },
    { fields: ['userId'] },
    { unique: true, fields: ['groupId', 'userId'] }
  ]
});

// Associations are defined in models/index.js to avoid duplicates

module.exports = { Group, GroupMember };
