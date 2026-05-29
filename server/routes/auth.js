const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dear-diary-super-secret-key-12345';

// User Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, diaryName, companionName, companionEmoji } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      passwordHash,
      diaryName: diaryName || 'My Diary',
      companionName: companionName || 'Ollie',
      companionEmoji: companionEmoji || '🦉',
      coins: 0,
      streak: 0,
      lastWrittenDate: null,
      isPremium: false
    });

    // Sign JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        diaryName: user.diaryName,
        companionName: user.companionName,
        companionEmoji: user.companionEmoji,
        coins: user.coins,
        streak: user.streak,
        isPremium: user.isPremium
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Sign JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        diaryName: user.diaryName,
        companionName: user.companionName,
        companionEmoji: user.companionEmoji,
        coins: user.coins,
        streak: user.streak,
        isPremium: user.isPremium,
        settingsPin: user.settingsPin
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile (Auth protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      diaryName: user.diaryName,
      companionName: user.companionName,
      companionEmoji: user.companionEmoji,
      coins: user.coins,
      streak: user.streak,
      isPremium: user.isPremium,
      settingsPin: user.settingsPin,
      lastWrittenDate: user.lastWrittenDate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error loading profile' });
  }
});

// Update PIN Settings (Auth protected)
router.put('/pin', authMiddleware, async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.settingsPin = pin || null;
    await user.save();

    res.json({ success: true, settingsPin: user.settingsPin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error updating PIN' });
  }
});

// Update Profile Settings (Auth protected)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, diaryName } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) {
      if (username !== user.username) {
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already taken' });
        }
      }
      user.username = username;
    }

    if (diaryName) {
      user.diaryName = diaryName;
    }

    await user.save();

    res.json({
      success: true,
      username: user.username,
      diaryName: user.diaryName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error updating profile settings' });
  }
});

// DELETE user account (Auth protected)
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Since we have onDelete: 'CASCADE' configured on user relationships,
    // user.destroy() will automatically remove all entries, snaps, and transactions.
    await user.destroy();

    res.json({ success: true, message: 'Account and all data successfully erased' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error deleting user account' });
  }
});

module.exports = router;
