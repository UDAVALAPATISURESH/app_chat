const express = require('express');
const { User } = require('../models');
const { Op } = require('sequelize');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Get all users (for finding contacts)
router.get('/all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: parseInt(userId) }
      },
      attributes: ['id', 'name', 'email', 'phone', 'avatar'],
      limit: 100
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Verify if user exists by email
router.get('/verify/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    const user = await User.findByPk(parseInt(userId), {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
