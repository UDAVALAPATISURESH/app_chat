/**
 * Google Gemini AI Integration
 * Provides AI-powered features: predictive typing and smart replies
 * Uses Google's Gemini Pro model for natural language processing
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI client with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get Predictive Typing Suggestions
 * Suggests the next words/phrases as user types
 * 
 * @param {string} partialMessage - What the user has typed so far
 * @param {Array} conversationHistory - Recent conversation context (optional)
 * @returns {Array} - Array of 3 suggestion strings
 */
const getPredictiveTyping = async (partialMessage, conversationHistory = []) => {
  try {
    // Get Gemini Pro model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Create prompt for AI
    // Ask AI to suggest next words/phrases based on partial message
    const prompt = `Given this partial message: "${partialMessage}", suggest the next 3 most likely words or phrases the user might type. Return only the suggestions separated by commas, nothing else.`;

    // Generate content using AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Parse AI response: split by comma and clean up
    const suggestions = response.text().trim().split(',').map(s => s.trim());

    // Return top 3 suggestions
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error('Predictive typing error:', error);
    return [];  // Return empty array on error
  }
};

/**
 * Get Smart Reply Suggestions
 * Generates context-aware quick reply options for incoming messages
 * 
 * @param {string} incomingMessage - The message received from other user
 * @param {Array} conversationHistory - Recent conversation context (optional)
 * @returns {Array} - Array of 3 smart reply strings
 */
const getSmartReplies = async (incomingMessage, conversationHistory = []) => {
  try {
    // Get Gemini Pro model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Format conversation history for context
    // Take last 5 messages and format as "sender: message"
    const historyContext = conversationHistory.slice(-5).map(msg => 
      `${msg.sender}: ${msg.message}`
    ).join('\n');

    // Create prompt with message and conversation context
    const prompt = `Given this incoming message: "${incomingMessage}"${historyContext ? `\n\nRecent conversation:\n${historyContext}` : ''}

Suggest 3 short, natural, and contextually appropriate reply options. Each reply should be concise (max 10 words). Return only the replies, one per line, nothing else.`;

    // Generate content using AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Parse AI response: split by newline, clean up, filter out invalid lines
    const replies = response.text().trim().split('\n')
      .map(r => r.trim())  // Remove whitespace
      .filter(r => r.length > 0 && !r.startsWith('*') && !r.startsWith('-'))  // Remove empty lines and markdown
      .slice(0, 3);  // Take first 3 replies

    return replies;
  } catch (error) {
    console.error('Smart replies error:', error);
    // Return default replies if AI fails
    return ['Okay', 'Got it', 'Thanks'];
  }
};

module.exports = {
  getPredictiveTyping,
  getSmartReplies
};
