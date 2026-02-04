/**
 * Personal Chat Socket Handler
 * Handles Socket.IO events for one-on-one personal messaging
 * Manages room joining, leaving, and message sending
 */

const { Chat, User } = require('../../models');  // Models

/**
 * Generate Unique Room ID
 * Creates a consistent room ID for two users regardless of who initiates
 * 
 * @param {string} email1 - First user's email
 * @param {string} email2 - Second user's email
 * @returns {string} - Unique room ID
 * 
 * Example: user1@email.com + user2@email.com = room_user1@email.com_user2@email.com
 * This ensures same room ID whether user1 or user2 starts the chat
 */
const generateRoomId = (email1, email2) => {
  // Sort emails alphabetically to ensure consistency
  const sorted = [email1.toLowerCase(), email2.toLowerCase()].sort();
  return `room_${sorted[0]}_${sorted[1]}`;
};

/**
 * Personal Chat Handler
 * Sets up Socket.IO event listeners for personal (1-on-1) chat functionality
 * 
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Individual socket connection
 */
const personalChatHandler = (io, socket) => {
  
  // ========== JOIN PERSONAL CHAT ROOM ==========
  // Event: 'join_room'
  // Purpose: Join a chat room with another user
  socket.on('join_room', async (data) => {
    try {
      const { otherUserEmail } = data;  // Email of user to chat with
      
      // ========== VERIFY USER EXISTS ==========
      // Check if the other user exists in database
      const otherUser = await User.findOne({
        where: { email: otherUserEmail.toLowerCase() }
      });
      if (!otherUser) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // ========== GENERATE ROOM ID ==========
      // Create unique room ID using both users' emails
      const roomId = generateRoomId(socket.user.email, otherUserEmail);
      
      // ========== JOIN SOCKET ROOM ==========
      // Add this socket to the room (allows receiving messages for this chat)
      socket.join(roomId);
      
      // ========== NOTIFY CLIENT ==========
      // Send confirmation to client that room was joined
      socket.emit('room_joined', {
        roomId,                    // Room ID for this chat
        otherUser: {               // Other user's information
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar
        }
      });

      console.log(`User ${socket.userId} joined room ${roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // ========== LEAVE PERSONAL CHAT ROOM ==========
  // Event: 'leave_room'
  // Purpose: Leave a chat room (stop receiving messages)
  socket.on('leave_room', (data) => {
    const { roomId } = data;
    socket.leave(roomId);  // Remove socket from room
    console.log(`User ${socket.userId} left room ${roomId}`);
  });

  // ========== SEND PERSONAL MESSAGE ==========
  // Event: 'send_personal_message'
  // Purpose: Send a message in a personal chat
  socket.on('send_personal_message', async (data) => {
    try {
      // ========== CREATE MESSAGE DOCUMENT ==========
      // Create new chat message in database
      const chat = await Chat.create({
        senderId: parseInt(socket.userId),        // Current user's ID
        receiverId: data.receiverId ? parseInt(data.receiverId) : null,    // Recipient's ID
        message: data.message,         // Message text
        messageType: data.messageType || 'text',  // Type: text, image, video, file
        mediaUrl: data.mediaUrl || '',  // Media URL if applicable
        roomId: data.roomId             // Room ID for this chat
      });

      // Fetch with populated sender
      const populatedChat = await Chat.findByPk(chat.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'avatar']
        }]
      });

      // ========== BROADCAST MESSAGE ==========
      // Send message to all users in the room (both sender and receiver)
      // io.to(roomId) sends to all sockets in that room
      io.to(data.roomId).emit('new_message', {
        _id: populatedChat.id,              // Message ID
        id: populatedChat.id,
        senderId: populatedChat.sender ? {
          _id: populatedChat.sender.id,
          id: populatedChat.sender.id,
          name: populatedChat.sender.name,
          email: populatedChat.sender.email,
          avatar: populatedChat.sender.avatar
        } : null,   // Sender's info
        message: populatedChat.message,    // Message text
        messageType: populatedChat.messageType,  // Message type
        mediaUrl: populatedChat.mediaUrl,  // Media URL
        roomId: populatedChat.roomId,      // Room ID
        timestamp: populatedChat.timestamp  // When sent
      });
    } catch (error) {
      console.error('Send personal message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
};

module.exports = personalChatHandler;
