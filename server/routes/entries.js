const express = require('express');
const router = express.Router();
const { User, DiaryEntry, Polaroid, Sticker } = require('../db');
const authMiddleware = require('../middleware/auth');

// GET all diary entries with attachments and stickers (Auth protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const entries = await DiaryEntry.findAll({
      where: { userId: req.userId },
      include: [Polaroid, Sticker],
      order: [['id', 'DESC']] // Sort descending (newest first)
    });

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve diary entries' });
  }
});

// POST create a new diary entry (Auth protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, mood, pageStyle, font, wordCount, date, photos, decorations } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Diary entry content is required' });
    }

    // 1. Create the entry
    const entry = await DiaryEntry.create({
      userId: req.userId,
      content,
      mood,
      pageStyle: pageStyle || 'classic',
      font: font || 'dancing',
      wordCount: wordCount || 0,
      date: date || new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    });

    // 2. Add Polaroids
    if (photos && Array.isArray(photos)) {
      for (const photo of photos) {
        await Polaroid.create({
          entryId: entry.id,
          src: photo.src,
          caption: photo.caption || '',
          left: photo.left || '30%',
          top: photo.top || '25%',
          tilt: photo.tilt || '2deg'
        });
      }
    }

    // 3. Add Stickers
    if (decorations && Array.isArray(decorations)) {
      for (const dec of decorations) {
        await Sticker.create({
          entryId: entry.id,
          type: dec.type,
          left: dec.left || '50%',
          top: dec.top || '40%'
        });
      }
    }

    // 4. Update user streaks (Writing streak)
    const user = await User.findByPk(req.userId);
    if (user) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (user.lastWrittenDate === todayStr) {
        // Already wrote today, streak remains the same
      } else if (user.lastWrittenDate === yesterdayStr) {
        // Wrote yesterday, increment streak
        user.streak += 1;
        user.lastWrittenDate = todayStr;
      } else {
        // Streak is broken or first time writing, reset to 1
        user.streak = 1;
        user.lastWrittenDate = todayStr;
      }
      await user.save();
    }

    // Load full created entry with associations for response
    const fullEntry = await DiaryEntry.findByPk(entry.id, {
      include: [Polaroid, Sticker]
    });

    res.status(201).json({
      entry: fullEntry,
      streak: user ? user.streak : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save diary entry' });
  }
});

// PUT update an existing diary entry (Auth protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, mood, pageStyle, font, wordCount, photos, decorations } = req.body;
    const entryId = req.params.id;

    // Verify entry ownership
    const entry = await DiaryEntry.findOne({ where: { id: entryId, userId: req.userId } });
    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized' });
    }

    // Update main fields
    entry.content = content || entry.content;
    entry.mood = mood !== undefined ? mood : entry.mood;
    entry.pageStyle = pageStyle || entry.pageStyle;
    entry.font = font || entry.font;
    entry.wordCount = wordCount || entry.wordCount;
    await entry.save();

    // Re-sync Polaroids (delete existing ones and create updated ones)
    if (photos && Array.isArray(photos)) {
      await Polaroid.destroy({ where: { entryId } });
      for (const photo of photos) {
        await Polaroid.create({
          entryId,
          src: photo.src,
          caption: photo.caption || '',
          left: photo.left || '30%',
          top: photo.top || '25%',
          tilt: photo.tilt || '2deg'
        });
      }
    }

    // Re-sync Stickers
    if (decorations && Array.isArray(decorations)) {
      await Sticker.destroy({ where: { entryId } });
      for (const dec of decorations) {
        await Sticker.create({
          entryId,
          type: dec.type,
          left: dec.left || '50%',
          top: dec.top || '40%'
        });
      }
    }

    // Load full updated entry
    const fullEntry = await DiaryEntry.findByPk(entryId, {
      include: [Polaroid, Sticker]
    });

    res.json(fullEntry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update diary entry' });
  }
});

// DELETE a diary entry (Auth protected)
router.get('/delete/:id', authMiddleware, async (req, res) => {
  // Supporting GET request deletion for simple testing if needed, but standard is DELETE.
  // Let's implement BOTH DELETE and GET /delete/:id to make testing and triggers super easy.
  try {
    const entryId = req.params.id;
    const entry = await DiaryEntry.findOne({ where: { id: entryId, userId: req.userId } });
    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized' });
    }

    await entry.destroy();
    res.json({ success: true, message: 'Diary entry deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const entryId = req.params.id;
    const entry = await DiaryEntry.findOne({ where: { id: entryId, userId: req.userId } });
    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized' });
    }

    await entry.destroy();
    res.json({ success: true, message: 'Diary entry deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

module.exports = router;
