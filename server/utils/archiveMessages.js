const cron = require('node-cron');
const { Chat, ArchivedChat } = require('../models');
const { Op } = require('sequelize');

// Run every night at 2 AM
const archiveOldMessages = async () => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Find all messages older than 1 day
    const oldMessages = await Chat.findAll({
      where: {
        timestamp: { [Op.lt]: oneDayAgo }
      }
    });

    if (oldMessages.length === 0) {
      console.log('No messages to archive');
      return;
    }

    // Move to archived collection
    const archivedData = oldMessages.map(msg => ({
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      groupId: msg.groupId,
      message: msg.message,
      messageType: msg.messageType,
      mediaUrl: msg.mediaUrl,
      roomId: msg.roomId,
      timestamp: msg.timestamp
    }));

    await ArchivedChat.bulkCreate(archivedData);

    // Delete from main chat collection
    const deletedCount = await Chat.destroy({
      where: {
        timestamp: { [Op.lt]: oneDayAgo }
      }
    });

    console.log(`Archived ${oldMessages.length} messages. Deleted ${deletedCount} from chats table.`);
  } catch (error) {
    console.error('Archive messages error:', error);
  }
};

// Schedule cron job to run every night at 2 AM
cron.schedule('0 2 * * *', archiveOldMessages, {
  scheduled: true,
  timezone: "America/New_York"
});

console.log('Archive messages cron job scheduled (runs daily at 2 AM)');

module.exports = archiveOldMessages;
