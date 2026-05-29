const express = require('express');
const router = express.Router();
const { User } = require('../db');
const authMiddleware = require('../middleware/auth');

// PUT update companion settings (Auth protected)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const name = req.body.name || req.body.companionName;
    const emoji = req.body.emoji || req.body.companionEmoji;
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.companionName = name;
    if (emoji) user.companionEmoji = emoji;
    await user.save();

    res.json({
      success: true,
      companionName: user.companionName,
      companionEmoji: user.companionEmoji
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update companion settings' });
  }
});

// POST companion chat simulator (Auth protected)
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Chat message is required' });
    }

    const companionName = user.companionName;
    const companionEmoji = user.companionEmoji;
    const msgLower = message.toLowerCase();

    let response = '';

    // Generate responsive feedback depending on companion emoji / identity
    if (companionEmoji === '🦉') { // Ollie (Wise)
      if (msgLower.includes('sad') || msgLower.includes('bad') || msgLower.includes('cry')) {
        response = `Remember, ${user.username}, stars can only shine in the dark. Take a deep breath and write down what hurts. I am here with you. 🦉`;
      } else if (msgLower.includes('happy') || msgLower.includes('good') || msgLower.includes('glad')) {
        response = `Wisdom lies in cherishing these moments of joy! Write it down so you can remember this warmth forever. 🦉`;
      } else {
        response = `A page written is a step towards understanding yourself better. Tell me more, my friend. 🦉`;
      }
    } else if (companionEmoji === '🐱') { // Luna (Cozy)
      if (msgLower.includes('sad') || msgLower.includes('bad')) {
        response = `Oh, poor thing. Wrap yourself in a warm blanket and have some tea. Writing in your journal will help make it cozy inside. 🐱`;
      } else if (msgLower.includes('happy') || msgLower.includes('good')) {
        response = `Mrow! That makes me want to purr! Such a sunny mood. Keep writing, it feels like a nice nap spot. 🐱`;
      } else {
        response = `Stretch your paws, relax, and let your thoughts flow onto the paper. Tell me all about it. 🐱`;
      }
    } else if (companionEmoji === '🌟') { // Stella (Magical)
      if (msgLower.includes('sad') || msgLower.includes('bad')) {
        response = `Even when the sky is cloudy, your inner starlight never fades! Let's write down your thoughts and make them sparkle. 🌟`;
      } else if (msgLower.includes('happy') || msgLower.includes('good')) {
        response = `How dazzling! Your mood is glowing like a shooting star! Capture this magic in your diary page. 🌟`;
      } else {
        response = `The universe is full of stories, and yours is my favorite. Write down your magical reflections. 🌟`;
      }
    } else if (companionEmoji === '🐻') { // Bruno (Warm)
      if (msgLower.includes('sad') || msgLower.includes('bad')) {
        response = `Sending you a giant bear hug! 🐻 It's okay to feel sad sometimes. Write it out, I am right here watching over you.`;
      } else if (msgLower.includes('happy') || msgLower.includes('good')) {
        response = `Hooray! That warms my heart! Let's celebrate by jotting down this awesome memory. 🐻`;
      } else {
        response = `I love hearing your thoughts. Tell me what's on your mind, I'm all ears. 🐻`;
      }
    } else if (companionEmoji === '🦊') { // Finn (Playful)
      if (msgLower.includes('sad') || msgLower.includes('bad')) {
        response = `Aww, that's no fun. But hey, writing it out is a sneaky way to clear your head! Let's chase those clouds away! 🦊`;
      } else if (msgLower.includes('happy') || msgLower.includes('good')) {
        response = `Awesome! Let's do a victory lap! 🦊 Write down the details so we can re-read it and smile later!`;
      } else {
        response = `Ooh, tell me more! Let's fill this page with wild thoughts! 🦊`;
      }
    } else if (companionEmoji === '🐧') { // Pip (Loyal)
      if (msgLower.includes('sad') || msgLower.includes('bad')) {
        response = `I'm standing by you, no matter what! 🐧 Write down your worries, together we can waddle through anything.`;
      } else if (msgLower.includes('happy') || msgLower.includes('good')) {
        response = `Wonderful! Waddle waddle! 🐧 That's amazing news. Let's record it so it's locked in the diary.`;
      } else {
        response = `I am constant like the polar ice. Let's write your thoughts, I am always listing! 🐧`;
      }
    } else { // Fallback general responses
      response = `I am listening closely. Your diary is a safe harbor for your reflections. Let's write them down. 📖`;
    }

    res.json({
      companionName,
      companionEmoji,
      reply: response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Companion chat failed' });
  }
});

module.exports = router;
