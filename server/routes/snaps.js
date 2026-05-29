const express = require('express');
const router = express.Router();
const { User, MemorySnap, DiaryEntry } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET all user snaps (Auth protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const snaps = await MemorySnap.findAll({
      where: { userId: req.userId },
      order: [['date', 'DESC']]
    });

    const streak = calculateSnapStreak(snaps);

    res.json({
      snaps,
      streak
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve snaps' });
  }
});

// POST upload a snap (Auth protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { src, date, linkedEntryId } = req.body;

    if (!src) {
      return res.status(400).json({ error: 'Snap base64 image data is required' });
    }

    const snapDate = date || new Date().toISOString().split('T')[0];

    // Check if snap already exists for this date (one snap per day constraint is typical)
    let snap = await MemorySnap.findOne({ where: { userId: req.userId, date: snapDate } });
    if (snap) {
      // Overwrite/update existing snap for today
      snap.src = src;
      snap.linkedEntryId = linkedEntryId || snap.linkedEntryId;
      await snap.save();
    } else {
      // Create new snap
      snap = await MemorySnap.create({
        userId: req.userId,
        src,
        date: snapDate,
        linkedEntryId: linkedEntryId || null
      });
    }

    // Recalculate snap streak
    const allSnaps = await MemorySnap.findAll({ where: { userId: req.userId } });
    const streak = calculateSnapStreak(allSnaps);

    res.status(201).json({
      snap,
      streak
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save snap' });
  }
});

// POST link snap to diary entry (Auth protected)
router.post('/link', authMiddleware, async (req, res) => {
  try {
    const { snapId, entryId } = req.body;

    if (!snapId || !entryId) {
      return res.status(400).json({ error: 'snapId and entryId are required' });
    }

    const snap = await MemorySnap.findOne({ where: { id: snapId, userId: req.userId } });
    if (!snap) {
      return res.status(404).json({ error: 'Snap not found' });
    }

    const entry = await DiaryEntry.findOne({ where: { id: entryId, userId: req.userId } });
    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found' });
    }

    snap.linkedEntryId = entryId;
    await snap.save();

    res.json({ success: true, snap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to link snap to entry' });
  }
});

// Helper function to calculate consecutive daily snaps streak
function calculateSnapStreak(snapsList) {
  if (snapsList.length === 0) return 0;
  
  // Sort unique snap dates descending
  const dates = snapsList.map(s => s.date).sort((a, b) => new Date(b) - new Date(a));
  const uniqueDates = [...new Set(dates)];
  
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const newestDate = uniqueDates[0];
  
  // If newest snap is before yesterday, streak is broken
  if (newestDate !== todayStr && newestDate !== yesterdayStr) {
    return 0;
  }
  
  let streak = 1;
  let current = new Date(newestDate);
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffTime = Math.abs(current - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      current = prevDate;
    } else if (diffDays > 1) {
      break; // Gap found in streaks
    }
  }
  return streak;
}

module.exports = router;
