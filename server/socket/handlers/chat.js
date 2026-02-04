const { Chat, User } = require('../../models');

const chatHandler = (io, socket) => {
  // Save message to database
  const saveMessage = async (data) => {
    try {
      const chat = await Chat.create({
        senderId: parseInt(socket.userId),
        receiverId: data.receiverId ? parseInt(data.receiverId) : null,
        groupId: data.groupId ? parseInt(data.groupId) : null,
        message: data.message,
        messageType: data.messageType || 'text',
        mediaUrl: data.mediaUrl || '',
        roomId: data.roomId
      });

      // Fetch with populated sender
      const populatedChat = await Chat.findByPk(chat.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'avatar']
        }]
      });

      return populatedChat;
    } catch (error) {
      console.error('Save message error:', error);
      throw error;
    }
  };

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const chat = await saveMessage(data);
      
      // Emit to all users in the room
      io.to(data.roomId).emit('new_message', {
        _id: chat.id,
        id: chat.id,
        senderId: chat.sender ? {
          _id: chat.sender.id,
          id: chat.sender.id,
          name: chat.sender.name,
          email: chat.sender.email,
          avatar: chat.sender.avatar
        } : null,
        message: chat.message,
        messageType: chat.messageType,
        mediaUrl: chat.mediaUrl,
        roomId: chat.roomId,
        timestamp: chat.timestamp
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};

module.exports = chatHandler;
