const jwt = require('jsonwebtoken');
const { User } = require('../models');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user.id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
