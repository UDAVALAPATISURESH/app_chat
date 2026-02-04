const express = require('express');
const { Chat, ArchivedChat } = require('../models');
const { Op } = require('sequelize');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Get messages for a room
router.get('/messages/:roomId', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await Chat.findAll({
      where: { roomId },
      include: [{
        model: require('../models').User,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(skip)
    });

    // Format messages to match expected structure
    const formattedMessages = messages.reverse().map(msg => ({
      _id: msg.id,
      id: msg.id,
      senderId: msg.sender ? {
        _id: msg.sender.id,
        id: msg.sender.id,
        name: msg.sender.name,
        email: msg.sender.email,
        avatar: msg.sender.avatar
      } : null,
      receiverId: msg.receiverId,
      groupId: msg.groupId,
      message: msg.message,
      messageType: msg.messageType,
      mediaUrl: msg.mediaUrl,
      roomId: msg.roomId,
      timestamp: msg.timestamp
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get archived messages for a room
router.get('/archived/:roomId', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await ArchivedChat.findAll({
      where: { roomId },
      include: [{
        model: require('../models').User,
        as: 'sender',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    // Format messages to match expected structure
    const formattedMessages = messages.reverse().map(msg => ({
      _id: msg.id,
      id: msg.id,
      senderId: msg.sender ? {
        _id: msg.sender.id,
        id: msg.sender.id,
        name: msg.sender.name,
        email: msg.sender.email,
        avatar: msg.sender.avatar
      } : null,
      receiverId: msg.receiverId,
      groupId: msg.groupId,
      message: msg.message,
      messageType: msg.messageType,
      mediaUrl: msg.mediaUrl,
      roomId: msg.roomId,
      timestamp: msg.timestamp,
      archivedAt: msg.archivedAt
    }));

    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Get archived messages error:', error);
    res.status(500).json({ error: 'Failed to fetch archived messages' });
  }
});

module.exports = router;
