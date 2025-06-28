const express = require('express');
const router = express.Router();
const AIService = require('../utils/aiService');

// Initialize AI service
const aiService = new AIService();

// Store conversation contexts (in production, use Redis or database)
const conversations = new Map();

// POST /api/chat - Handle chat messages
router.post('/', async (req, res) => {
  try {
    const { message, userId, conversationId, useReasoner = false } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        error: 'Message and userId are required',
        success: false
      });
    }

    // Get or create conversation context
    const contextKey = `${userId}_${conversationId || 'default'}`;
    let context = conversations.get(contextKey) || [];

    // Determine if we should use reasoner model
    const shouldUseReasoner = useReasoner || aiService.shouldUseReasoner(message);

    // Process the message
    const result = await aiService.processMessage(message, context, shouldUseReasoner);

    // Update conversation context
    context.push(
      { role: 'user', content: message },
      { role: 'assistant', content: result.response }
    );

    // Keep only last 20 messages to prevent memory issues
    if (context.length > 20) {
      context = context.slice(-20);
    }
    conversations.set(contextKey, context);

    res.json({
      success: true,
      response: result.response,
      source: result.source,
      model: result.model,
      timestamp: result.timestamp,
      usage: result.usage,
      conversationId: conversationId || 'default'
    });

  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/chat/stream - Handle streaming chat messages
router.post('/stream', async (req, res) => {
  try {
    const { message, userId, conversationId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        error: 'Message and userId are required',
        success: false
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Get conversation context
    const contextKey = `${userId}_${conversationId || 'default'}`;
    let context = conversations.get(contextKey) || [];

    let fullResponse = '';

    // Stream the response
    await aiService.streamResponse(message, context, (chunk, isComplete) => {
      if (!isComplete) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: chunk,
          timestamp: new Date().toISOString()
        })}\n\n`);
      } else {
        // Update conversation context
        context.push(
          { role: 'user', content: message },
          { role: 'assistant', content: fullResponse }
        );

        if (context.length > 20) {
          context = context.slice(-20);
        }
        conversations.set(contextKey, context);

        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          fullResponse: fullResponse,
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error('Streaming chat error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: 'Failed to process streaming chat',
      timestamp: new Date().toISOString()
    })}\n\n`);
    res.end();
  }
});

// GET /api/chat/history/:userId - Get conversation history
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId = 'default' } = req.query;

    const contextKey = `${userId}_${conversationId}`;
    const context = conversations.get(contextKey) || [];

    res.json({
      success: true,
      history: context,
      conversationId: conversationId
    });

  } catch (error) {
    console.error('History route error:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation history',
      success: false
    });
  }
});

// DELETE /api/chat/history/:userId - Clear conversation history
router.delete('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId = 'default' } = req.query;

    const contextKey = `${userId}_${conversationId}`;
    conversations.delete(contextKey);

    res.json({
      success: true,
      message: 'Conversation history cleared'
    });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      error: 'Failed to clear conversation history',
      success: false
    });
  }
});

// POST /api/chat/web-search - Direct web search endpoint
router.post('/web-search', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query || !userId) {
      return res.status(400).json({
        error: 'Query and userId are required',
        success: false
      });
    }

    const result = await aiService.webSearch(query);

    res.json({
      success: true,
      response: result.response,
      source: result.source,
      timestamp: result.timestamp,
      query: query
    });

  } catch (error) {
    console.error('Web search route error:', error);
    res.status(500).json({
      error: 'Failed to perform web search',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

