/**
 * Models Index
 * Initializes all Sequelize models and their associations
 */

const sequelize = require('../config/database');
const User = require('./User');
const Chat = require('./Chat');
const { Group, GroupMember } = require('./Group');
const ArchivedChat = require('./ArchivedChat');

// Initialize associations
// Chat associations
Chat.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Chat.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Group associations
Group.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
Group.belongsToMany(User, { 
  through: GroupMember, 
  foreignKey: 'groupId', 
  otherKey: 'userId',
  as: 'members'
});
User.belongsToMany(Group, { 
  through: GroupMember, 
  foreignKey: 'userId', 
  otherKey: 'groupId',
  as: 'groups'
});

// GroupMember associations
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'Group' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'User' });

// ArchivedChat associations
ArchivedChat.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
ArchivedChat.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Sync database (only in development - use migrations in production)
if (process.env.NODE_ENV !== 'production') {
  sequelize.sync({ alter: false }).then(() => {
    console.log('Database models synchronized');
  }).catch(err => {
    console.error('Error syncing database:', err);
  });
}

module.exports = {
  sequelize,
  User,
  Chat,
  Group,
  GroupMember,
  ArchivedChat
};
