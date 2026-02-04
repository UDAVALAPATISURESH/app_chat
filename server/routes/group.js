const express = require('express');
const { Group, GroupMember, User } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Create a new group
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const userId = req.user.id;
    
    if (!userId) {
      console.error('User ID not found when creating group:', req.user);
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    console.log('Creating group for user ID:', userId);
    
    const allMemberIds = [userId, ...(memberIds || []).map(id => parseInt(id))];

    // Create group with transaction
    const group = await Group.create({
      name,
      description: description || '',
      adminId: userId
    });

    // Add members
    await group.setMembers(allMemberIds);

    // Fetch group with populated data
    const populatedGroup = await Group.findByPk(group.id, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    // Format response
    const formattedGroup = {
      _id: populatedGroup.id,
      id: populatedGroup.id,
      name: populatedGroup.name,
      description: populatedGroup.description,
      admin: populatedGroup.admin ? {
        _id: populatedGroup.admin.id,
        id: populatedGroup.admin.id,
        name: populatedGroup.admin.name,
        email: populatedGroup.admin.email,
        avatar: populatedGroup.admin.avatar
      } : null,
      members: populatedGroup.members ? populatedGroup.members.map(m => ({
        _id: m.id,
        id: m.id,
        name: m.name,
        email: m.email,
        avatar: m.avatar
      })) : [],
      avatar: populatedGroup.avatar,
      createdAt: populatedGroup.createdAt
    };

    res.status(201).json({ group: formattedGroup });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get all groups for current user
router.get('/my-groups', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      console.error('User ID not found in req.user:', JSON.stringify(req.user, null, 2));
      return res.status(401).json({ error: 'User ID not found', debug: req.user });
    }
    
    console.log('Fetching groups for user ID:', userId);
    
    // Find groups where user is a member using GroupMember
    const groupMembers = await GroupMember.findAll({
      where: { userId: userId }
    });

    // Get all group IDs
    const groupIds = groupMembers.map(gm => gm.groupId);

    if (groupIds.length === 0) {
      return res.json({ groups: [] });
    }

    // Fetch groups with all related data
    const groups = await Group.findAll({
      where: { id: groupIds },
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedGroups = groups.map(group => ({
      _id: group.id,
      id: group.id,
      name: group.name,
      description: group.description || '',
      admin: group.admin ? {
        _id: group.admin.id,
        id: group.admin.id,
        name: group.admin.name,
        email: group.admin.email,
        avatar: group.admin.avatar || ''
      } : null,
      members: group.members ? group.members.map(m => ({
        _id: m.id,
        id: m.id,
        name: m.name,
        email: m.email,
        avatar: m.avatar || ''
      })) : [],
      avatar: group.avatar || '',
      createdAt: group.createdAt
    }));

    res.json({ groups: formattedGroups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups', details: error.message });
  }
});

// Add member to group by userId
router.post('/:groupId/add-member', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id']
        }
      ]
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const currentUserId = req.user.id || req.user._id;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    if (group.adminId !== parseInt(currentUserId)) {
      return res.status(403).json({ error: 'Only admin can add members' });
    }

    const isMember = group.members && group.members.some(member => member.id == userId);

    if (!isMember) {
      await group.addMember(userId);
      
      // Fetch updated group with all data
      const updatedGroup = await Group.findByPk(groupId, {
        include: [
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'name', 'email', 'avatar']
          },
          {
            model: User,
            as: 'members',
            attributes: ['id', 'name', 'email', 'avatar']
          }
        ]
      });

      const formattedGroup = {
        _id: updatedGroup.id,
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description || '',
        admin: updatedGroup.admin ? {
          _id: updatedGroup.admin.id,
          id: updatedGroup.admin.id,
          name: updatedGroup.admin.name,
          email: updatedGroup.admin.email,
          avatar: updatedGroup.admin.avatar || ''
        } : null,
        members: updatedGroup.members ? updatedGroup.members.map(m => ({
          _id: m.id,
          id: m.id,
          name: m.name,
          email: m.email,
          avatar: m.avatar || ''
        })) : [],
        avatar: updatedGroup.avatar || '',
        createdAt: updatedGroup.createdAt
      };

      return res.json({ group: formattedGroup });
    }

    // Format existing group
    const formattedGroup = {
      _id: group.id,
      id: group.id,
      name: group.name,
      description: group.description || '',
      admin: group.admin ? {
        _id: group.admin.id,
        id: group.admin.id
      } : null,
      members: group.members ? group.members.map(m => ({ _id: m.id, id: m.id })) : [],
      avatar: group.avatar || '',
      createdAt: group.createdAt
    };

    res.json({ group: formattedGroup });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member', details: error.message });
  }
});

// Add member to group by email
router.post('/:groupId/add-member-by-email', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const userToAdd = await User.findOne({
      where: { email: email.toLowerCase() },
      attributes: ['id', 'name', 'email', 'avatar']
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id']
        }
      ]
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const currentUserId = req.user.id || req.user._id;
    
    if (!currentUserId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    if (group.adminId !== parseInt(currentUserId)) {
      return res.status(403).json({ error: 'Only admin can add members' });
    }

    const isMember = group.members && group.members.some(member => member.id == userToAdd.id);

    if (isMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    await group.addMember(userToAdd.id);
    
    // Fetch updated group with all data
    const updatedGroup = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    const formattedGroup = {
      _id: updatedGroup.id,
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description || '',
      admin: updatedGroup.admin ? {
        _id: updatedGroup.admin.id,
        id: updatedGroup.admin.id,
        name: updatedGroup.admin.name,
        email: updatedGroup.admin.email,
        avatar: updatedGroup.admin.avatar || ''
      } : null,
      members: updatedGroup.members ? updatedGroup.members.map(m => ({
        _id: m.id,
        id: m.id,
        name: m.name,
        email: m.email,
        avatar: m.avatar || ''
      })) : [],
      avatar: updatedGroup.avatar || '',
      createdAt: updatedGroup.createdAt
    };

    res.json({ group: formattedGroup, message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member by email error:', error);
    res.status(500).json({ error: 'Failed to add member', details: error.message });
  }
});

module.exports = router;
