/**
 * Authentication Routes
 * Handles user signup and login with password encryption and JWT token generation
 */

const express = require('express');
const bcrypt = require('bcryptjs');      // For password hashing
const jwt = require('jsonwebtoken');     // For JWT token generation
const { User } = require('../models');   // User database model

const router = express.Router();

/**
 * POST /api/auth/signup
 * User Registration Endpoint
 * 
 * Takes: name, email, phone, password
 * Returns: JWT token and user data
 * 
 * Process:
 * 1. Validate all required fields
 * 2. Check if user already exists (by email or phone)
 * 3. Hash the password using bcrypt
 * 4. Create new user in database
 * 5. Generate JWT token
 * 6. Return token and user info (without password)
 */
router.post('/signup', async (req, res) => {
  try {
    // Extract user data from request body
    const { name, email, phone, password } = req.body;

    // ========== VALIDATION ==========
    // Check if all required fields are provided
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // ========== CHECK EXISTING USER ==========
    // Check if a user with this email or phone already exists
    const { Op } = require('sequelize');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // ========== PASSWORD HASHING ==========
    // Hash password with bcrypt (10 rounds of salting)
    // This ensures passwords are never stored in plain text
    const hashedPassword = await bcrypt.hash(password, 10);

    // ========== CREATE USER ==========
    // Create new user with hashed password
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword  // Store hashed password, not plain text
    });

    // ========== GENERATE JWT TOKEN ==========
    // Create JWT token with user ID as payload
    // Token expires in 7 days
    const token = jwt.sign(
      { userId: user.id },  // Token payload (user ID)
      process.env.JWT_SECRET || 'your-secret-key',  // Secret key for signing
      { expiresIn: '7d' }  // Token expiration time
    );

    // ========== RETURN SUCCESS RESPONSE ==========
    // Return token and user data (excluding password)
    res.status(201).json({
      message: 'User created successfully',
      token,  // JWT token for authentication
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
        // Password is NOT included in response
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

/**
 * POST /api/auth/login
 * User Login Endpoint
 * 
 * Takes: emailOrPhone, password
 * Returns: JWT token and user data
 * 
 * Process:
 * 1. Validate required fields
 * 2. Find user by email OR phone number
 * 3. Verify password using bcrypt
 * 4. Generate JWT token
 * 5. Return token and user info
 */
router.post('/login', async (req, res) => {
  try {
    // Extract login credentials from request body
    const { emailOrPhone, password } = req.body;

    // ========== VALIDATION ==========
    // Check if both email/phone and password are provided
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required' });
    }

    // ========== FIND USER ==========
    // Search for user by email (case-insensitive) OR phone number
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: emailOrPhone.toLowerCase() },  // Try email (lowercase)
          { phone: emailOrPhone }                // Try phone number
        ]
      }
    });

    // If user not found, return error (don't reveal if email/phone exists)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ========== VERIFY PASSWORD ==========
    // Compare provided password with hashed password in database
    // bcrypt.compare() handles the hashing and comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password doesn't match, return error
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ========== GENERATE JWT TOKEN ==========
    // Create JWT token with user ID as payload
    // Token expires in 7 days
    const token = jwt.sign(
      { userId: user.id || user._id },  // Token payload
      process.env.JWT_SECRET || 'your-secret-key',  // Secret key
      { expiresIn: '7d' }  // Expiration time
    );

    // ========== RETURN SUCCESS RESPONSE ==========
    // Return token and user data
    res.json({
      message: 'Login successful',
      token,  // JWT token for subsequent requests
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar
        // Password is NOT included
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
