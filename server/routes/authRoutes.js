const express = require('express');
const router = express.Router();
const { getUserRepository } = require('../repositories/userRepositoryFactory');
const { generateToken, protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user (email & password only)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const userRepository = getUserRepository();

    // Check if user already exists
    const userExists = await userRepository.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create user
    const newUser = await userRepository.createUser({
      email: email.trim(),
      password
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      user: {
        _id: String(newUser._id),
        email: newUser.email
      },
      token
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const userRepository = getUserRepository();
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await userRepository.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      user: {
        _id: String(user._id),
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
