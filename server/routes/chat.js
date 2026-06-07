const express = require('express');
const router = express.Router();

router.post('/api/chat', handleChat);
router.post('/chat', handleChat);
router.post('/', handleChat);

async function handleChat(req, res) {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not defined in the environment.');
      return res.status(500).json({ error: 'API key configuration missing' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: message
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: 'You are Dia, a warm and empathetic diary companion. Help users reflect on their thoughts and feelings. Keep responses short, gentle and supportive.'
          }
        ]
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API request failed:', errorText);
      return res.status(response.status).json({ error: 'Failed to communicate with Gemini API' });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({ reply });
  } catch (err) {
    console.error('Error in /api/chat route:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = router;
