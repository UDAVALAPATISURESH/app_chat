const express = require('express');
const { getPredictiveTyping, getSmartReplies } = require('../utils/geminiAI');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Get predictive typing suggestions
router.post('/predictive-typing', authenticate, async (req, res) => {
  try {
    const { partialMessage, conversationHistory } = req.body;

    if (!partialMessage) {
      return res.status(400).json({ error: 'Partial message is required' });
    }

    const suggestions = await getPredictiveTyping(partialMessage, conversationHistory);
    res.json({ suggestions });
  } catch (error) {
    console.error('Predictive typing API error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get smart replies
router.post('/smart-replies', authenticate, async (req, res) => {
  try {
    const { incomingMessage, conversationHistory } = req.body;

    if (!incomingMessage) {
      return res.status(400).json({ error: 'Incoming message is required' });
    }

    const replies = await getSmartReplies(incomingMessage, conversationHistory);
    res.json({ replies });
  } catch (error) {
    console.error('Smart replies API error:', error);
    res.status(500).json({ error: 'Failed to get smart replies' });
  }
});

module.exports = router;
