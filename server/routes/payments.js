const express = require('express');
const router = express.Router();
const { User } = require('../db');
const authMiddleware = require('../middleware/auth');

// POST checkout session simulation (Auth protected)
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isPremium) {
      return res.status(400).json({ error: 'User is already a premium member' });
    }

    // Mock a checkout session transaction reference
    res.json({
      sessionId: `mock_session_${Date.now()}`,
      checkoutUrl: `https://checkout.example.com/pay/mock_session_${Date.now()}`,
      price: 4.99,
      currency: 'USD',
      productName: 'Golden Diary Premium Upgrade'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initiate mock checkout session' });
  }
});

// POST confirm payment and activate premium account status (Auth protected)
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required for payment confirmation' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Flag the user as premium in SQLite database
    user.isPremium = true;
    await user.save();

    res.json({
      success: true,
      message: 'Golden Diary Premium membership activated successfully! 👑',
      user: {
        id: user.id,
        username: user.username,
        isPremium: user.isPremium
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm premium upgrade payment' });
  }
});

module.exports = router;
