const express = require('express');
const router = express.Router();
const { User, CoinTransaction } = require('../db');
const authMiddleware = require('../middleware/auth');

// List of daily challenge strings
const CHALLENGES = [
  "Write 3 things you are grateful for today 🌸",
  "Describe a small act of kindness you witnessed or did today ✨",
  "Write about a memory that always makes you laugh or smile 😊",
  "What is a goal you have for tomorrow, and how will you work towards it? 🎯",
  "Reflect on a book, movie, or song that inspired you recently 🎵",
  "Write about a challenge you overcame today or in the past week ⛰️",
  "What is one thing you appreciate about your companion today? 🦉"
];

// GET the active daily challenge and reset timer (Auth protected)
router.get('/challenge', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
    const activeChallenge = CHALLENGES[dayOfWeek];

    // Calculate seconds left until next midnight
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // Set to 00:00:00 of tomorrow
    const secondsLeft = Math.floor((nextMidnight.getTime() - now.getTime()) / 1000);

    res.json({
      challenge: activeChallenge,
      resetsInSeconds: secondsLeft
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve daily challenge' });
  }
});

// POST reward user with coins (Auth protected)
router.post('/reward', authMiddleware, async (req, res) => {
  try {
    const { amount, source } = req.body;

    if (!amount || !source) {
      return res.status(400).json({ error: 'amount and source are required' });
    }

    const coinAmount = parseInt(amount, 10);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return res.status(400).json({ error: 'Invalid coin reward amount' });
    }

    // Limit single reward transactions to avoid abuse checks (max 100 coins fallback)
    if (coinAmount > 100) {
      return res.status(400).json({ error: 'Reward amount exceeds daily transaction limits' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user coins
    user.coins += coinAmount;
    await user.save();

    // Log coin transaction
    const transaction = await CoinTransaction.create({
      userId: req.userId,
      amount: coinAmount,
      source
    });

    res.json({
      success: true,
      coins: user.coins,
      transaction
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to award coins' });
  }
});

// GET user transaction logs (Auth protected)
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await CoinTransaction.findAll({
      where: { userId: req.userId },
      order: [['id', 'DESC']]
    });

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve transaction logs' });
  }
});

module.exports = router;
