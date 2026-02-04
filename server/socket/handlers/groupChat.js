const { Chat, Group, User } = require('../../models');

const groupChatHandler = (io, socket) => {
  // Join group chat
  socket.on('join_group', async (data) => {
    try {
      const { groupId } = data;
      
      const group = await Group.findByPk(groupId, {
        include: [{
          model: User,
          as: 'members',
          attributes: ['id']
        }]
      });
      
      if (!group) {
        socket.emit('error', { message: 'Group not found' });
        return;
      }

      // Check if user is a member
      const isMember = group.members && group.members.some(member => member.id == socket.userId);
      if (!isMember) {
        socket.emit('error', { message: 'You are not a member of this group' });
        return;
      }

      const roomId = `group_${groupId}`;
      socket.join(roomId);
      
      socket.emit('group_joined', {
        roomId,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          members: group.members ? group.members.map(m => ({
            _id: m.id,
            id: m.id
          })) : []
        }
      });

      console.log(`User ${socket.userId} joined group ${groupId}`);
    } catch (error) {
      console.error('Join group error:', error);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  // Leave group chat
  socket.on('leave_group', (data) => {
    const { groupId } = data;
    const roomId = `group_${groupId}`;
    socket.leave(roomId);
    console.log(`User ${socket.userId} left group ${groupId}`);
  });

  // Send group message
  socket.on('send_group_message', async (data) => {
    try {
      const chat = await Chat.create({
        senderId: parseInt(socket.userId),
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

      // Send to all users in the group room
      io.to(data.roomId).emit('new_message', {
        _id: populatedChat.id,
        id: populatedChat.id,
        senderId: populatedChat.sender ? {
          _id: populatedChat.sender.id,
          id: populatedChat.sender.id,
          name: populatedChat.sender.name,
          email: populatedChat.sender.email,
          avatar: populatedChat.sender.avatar
        } : null,
        message: populatedChat.message,
        messageType: populatedChat.messageType,
        mediaUrl: populatedChat.mediaUrl,
        roomId: populatedChat.roomId,
        timestamp: populatedChat.timestamp
      });
    } catch (error) {
      console.error('Send group message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};

module.exports = groupChatHandler;
