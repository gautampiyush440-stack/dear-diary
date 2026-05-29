const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Simple metadata endpoint for notifications schedule preferences
router.get('/settings', authMiddleware, (req, res) => {
  res.json({
    enabled: true,
    time: '21:00', // default 9 PM daily writing reminder
    type: 'push'
  });
});

router.post('/settings', authMiddleware, (req, res) => {
  const { enabled, time, type } = req.body;
  res.json({
    success: true,
    settings: {
      enabled: enabled !== undefined ? enabled : true,
      time: time || '21:00',
      type: type || 'push'
    }
  });
});

module.exports = router;
