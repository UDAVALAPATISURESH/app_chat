/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user information to request object
 * Used to protect routes that require authentication
 */

const jwt = require('jsonwebtoken');      // For verifying JWT tokens
const { User } = require('../models');    // User database model

/**
 * Authentication Middleware Function
 * 
 * Process:
 * 1. Extract JWT token from Authorization header
 * 2. Verify token signature
 * 3. Decode token to get user ID
 * 4. Fetch user from database
 * 5. Attach user to request object
 * 6. Call next() to continue to route handler
 * 
 * If any step fails, return 401 Unauthorized error
 */
const authenticate = async (req, res, next) => {
  try {
    // ========== EXTRACT TOKEN ==========
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];

    // ========== VALIDATE TOKEN EXISTS ==========
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // ========== VERIFY TOKEN ==========
    // Verify token signature and decode payload
    // This throws an error if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // ========== FETCH USER ==========
    // Get user from database using ID from token
    // Explicitly include id in attributes to ensure it's always present
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'name', 'email', 'phone', 'avatar', 'createdAt']
    });

    // ========== VALIDATE USER EXISTS ==========
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // ========== ATTACH USER TO REQUEST ==========
    // Convert Sequelize instance to plain object
    // Use get({ plain: true }) which is the standard Sequelize method
    req.user = user.get({ plain: true });
    
    // Ensure id is an integer
    if (req.user.id) {
      req.user.id = parseInt(req.user.id);
    } else {
      console.error('ERROR: User ID is missing after conversion:', req.user);
      return res.status(401).json({ error: 'User ID not found in user object' });
    }
    
    console.log('Authenticated user ID:', req.user.id);
    
    // ========== CONTINUE TO ROUTE HANDLER ==========
    // Call next() to proceed to the actual route handler
    next();
  } catch (error) {
    // ========== HANDLE ERRORS ==========
    // Token verification failed (invalid, expired, or malformed)
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
