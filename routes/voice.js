const express = require('express');
const router = express.Router();
const AIService = require('../utils/aiService');

// Initialize AI service
const aiService = new AIService();

// Store voice sessions (in production, use Redis or database)
const voiceSessions = new Map();

// POST /api/voice/process - Process voice input
router.post('/process', async (req, res) => {
  try {
    const { transcript, userId, sessionId, language = 'en', confidence } = req.body;

    if (!transcript || !userId) {
      return res.status(400).json({
        error: 'Transcript and userId are required',
        success: false
      });
    }

    // Validate confidence level
    if (confidence && confidence < 0.7) {
      return res.json({
        success: true,
        response: "I didn't quite catch that. Could you please repeat?",
        confidence: confidence,
        timestamp: new Date().toISOString(),
        requiresRepeat: true
      });
    }

    // Get or create voice session context
    const contextKey = `${userId}_${sessionId || 'default'}`;
    let context = voiceSessions.get(contextKey) || [];

    // Process voice command through AI service
    const result = await aiService.processMessage(transcript, context);

    // Update voice session context
    context.push(
      { role: 'user', content: transcript, type: 'voice' },
      { role: 'assistant', content: result.response, type: 'voice' }
    );

    // Keep only last 10 voice interactions
    if (context.length > 20) {
      context = context.slice(-20);
    }
    voiceSessions.set(contextKey, context);

    // Check if this is a command that needs special handling
    const commandType = detectCommandType(transcript);

    res.json({
      success: true,
      response: result.response,
      source: result.source,
      model: result.model,
      timestamp: result.timestamp,
      commandType: commandType,
      sessionId: sessionId || 'default',
      language: language,
      confidence: confidence || 1.0,
      shouldSpeak: true // Indicate that response should be spoken
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({
      error: 'Failed to process voice input',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/voice/command - Process specific voice commands
router.post('/command', async (req, res) => {
  try {
    const { command, userId, parameters = {} } = req.body;

    if (!command || !userId) {
      return res.status(400).json({
        error: 'Command and userId are required',
        success: false
      });
    }

    const result = await processVoiceCommand(command, userId, parameters);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice command error:', error);
    res.status(500).json({
      error: 'Failed to process voice command',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/voice/session/:userId - Get voice session history
router.get('/session/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId = 'default' } = req.query;

    const contextKey = `${userId}_${sessionId}`;
    const context = voiceSessions.get(contextKey) || [];

    res.json({
      success: true,
      history: context,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Voice session error:', error);
    res.status(500).json({
      error: 'Failed to retrieve voice session',
      success: false
    });
  }
});

// DELETE /api/voice/session/:userId - Clear voice session
router.delete('/session/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId = 'default' } = req.query;

    const contextKey = `${userId}_${sessionId}`;
    voiceSessions.delete(contextKey);

    res.json({
      success: true,
      message: 'Voice session cleared'
    });

  } catch (error) {
    console.error('Clear voice session error:', error);
    res.status(500).json({
      error: 'Failed to clear voice session',
      success: false
    });
  }
});

// POST /api/voice/wake-word - Handle wake word detection
router.post('/wake-word', async (req, res) => {
  try {
    const { userId, wakeWord, confidence, timestamp } = req.body;

    if (!userId || !wakeWord) {
      return res.status(400).json({
        error: 'userId and wakeWord are required',
        success: false
      });
    }

    // Log wake word detection
    console.log(`Wake word "${wakeWord}" detected for user ${userId} with confidence ${confidence}`);

    // You can add specific wake word handling logic here
    const response = await handleWakeWord(wakeWord, userId);

    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Wake word error:', error);
    res.status(500).json({
      error: 'Failed to process wake word',
      success: false
    });
  }
});

// POST /api/voice/emergency - Handle emergency voice commands
router.post('/emergency', async (req, res) => {
  try {
    const { userId, emergencyType, location, additionalInfo } = req.body;

    if (!userId || !emergencyType) {
      return res.status(400).json({
        error: 'userId and emergencyType are required',
        success: false
      });
    }

    // Handle emergency command
    const result = await handleEmergencyCommand(userId, emergencyType, location, additionalInfo);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      priority: 'high'
    });

  } catch (error) {
    console.error('Emergency voice command error:', error);
    res.status(500).json({
      error: 'Failed to process emergency command',
      success: false
    });
  }
});

// Helper functions

function detectCommandType(transcript) {
  const lowerTranscript = transcript.toLowerCase();
  
  if (lowerTranscript.includes('book') && (lowerTranscript.includes('ticket') || lowerTranscript.includes('flight') || lowerTranscript.includes('train') || lowerTranscript.includes('bus'))) {
    return 'booking';
  }
  
  if (lowerTranscript.includes('emergency') || lowerTranscript.includes('help') || lowerTranscript.includes('urgent')) {
    return 'emergency';
  }
  
  if (lowerTranscript.includes('weather') || lowerTranscript.includes('news') || lowerTranscript.includes('search')) {
    return 'information';
  }
  
  if (lowerTranscript.includes('remind') || lowerTranscript.includes('schedule') || lowerTranscript.includes('calendar')) {
    return 'reminder';
  }
  
  if (lowerTranscript.includes('call') || lowerTranscript.includes('message') || lowerTranscript.includes('contact')) {
    return 'communication';
  }
  
  return 'general';
}

async function processVoiceCommand(command, userId, parameters) {
  switch (command) {
    case 'book_ticket':
      return await handleBookingCommand(userId, parameters);
    
    case 'get_weather':
      return await handleWeatherCommand(parameters.location);
    
    case 'set_reminder':
      return await handleReminderCommand(userId, parameters);
    
    case 'emergency_alert':
      return await handleEmergencyCommand(userId, parameters.type, parameters.location, parameters.info);
    
    case 'get_news':
      return await handleNewsCommand(parameters.category);
    
    default:
      return {
        response: `Command "${command}" is not recognized. Available commands: book_ticket, get_weather, set_reminder, emergency_alert, get_news`,
        commandType: 'unknown'
      };
  }
}

async function handleBookingCommand(userId, parameters) {
  try {
    // Extract booking parameters from voice command
    const bookingData = {
      type: parameters.type || 'bus',
      from: parameters.from,
      to: parameters.to,
      date: parameters.date,
      passengers: parameters.passengers || [{ name: 'User', age: 30 }]
    };

    // Add required fields based on type
    if (bookingData.type === 'train') {
      bookingData.class = parameters.class || '3ac';
      bookingData.time = parameters.time || '10:00';
    } else if (bookingData.type === 'flight') {
      bookingData.departureDate = bookingData.date;
      bookingData.class = parameters.class || 'economy';
    } else {
      bookingData.time = parameters.time || '10:00';
    }

    return {
      response: `I'll help you book a ${bookingData.type} ticket from ${bookingData.from} to ${bookingData.to}. Let me check available options.`,
      commandType: 'booking',
      bookingData: bookingData,
      nextAction: 'simulate_booking'
    };

  } catch (error) {
    return {
      response: "I couldn't process your booking request. Please provide more details like departure city, destination, and travel date.",
      commandType: 'booking',
      error: error.message
    };
  }
}

async function handleWeatherCommand(location) {
  try {
    // Use AI service to get weather information
    const weatherQuery = `What's the current weather in ${location}?`;
    const result = await aiService.webSearch(weatherQuery);

    return {
      response: result.response,
      commandType: 'weather',
      location: location
    };

  } catch (error) {
    return {
      response: `I couldn't get the weather information for ${location}. Please try again later.`,
      commandType: 'weather',
      error: error.message
    };
  }
}

async function handleReminderCommand(userId, parameters) {
  try {
    const reminder = {
      userId: userId,
      title: parameters.title || parameters.message,
      datetime: parameters.datetime,
      type: parameters.type || 'general'
    };

    return {
      response: `I've set a reminder for "${reminder.title}" at ${reminder.datetime}.`,
      commandType: 'reminder',
      reminder: reminder,
      nextAction: 'save_reminder'
    };

  } catch (error) {
    return {
      response: "I couldn't set the reminder. Please specify what you want to be reminded about and when.",
      commandType: 'reminder',
      error: error.message
    };
  }
}

async function handleEmergencyCommand(userId, emergencyType, location, additionalInfo) {
  try {
    const emergency = {
      userId: userId,
      type: emergencyType,
      location: location,
      additionalInfo: additionalInfo,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    // In a real application, this would trigger actual emergency services
    return {
      response: `Emergency alert activated for ${emergencyType}. Help is on the way. Stay calm and safe.`,
      commandType: 'emergency',
      emergency: emergency,
      nextAction: 'notify_emergency_contacts'
    };

  } catch (error) {
    return {
      response: "Emergency alert could not be processed. Please call emergency services directly.",
      commandType: 'emergency',
      error: error.message
    };
  }
}

async function handleNewsCommand(category) {
  try {
    const newsQuery = category ? `Latest ${category} news` : 'Latest news headlines';
    const result = await aiService.webSearch(newsQuery);

    return {
      response: result.response,
      commandType: 'news',
      category: category
    };

  } catch (error) {
    return {
      response: "I couldn't fetch the latest news right now. Please try again later.",
      commandType: 'news',
      error: error.message
    };
  }
}

async function handleWakeWord(wakeWord, userId) {
  const responses = {
    'neura': "Yes, I'm here. How can I help you?",
    'guardian': "Guardian Angel at your service. What do you need?",
    'angel': "I'm listening. What can I do for you?",
    'hey neura': "Hello! I'm ready to assist you.",
    'ok guardian': "Yes, I'm here. How may I help?"
  };

  const response = responses[wakeWord.toLowerCase()] || "I'm here. How can I assist you?";

  return {
    response: response,
    commandType: 'wake_word',
    wakeWord: wakeWord,
    isListening: true
  };
}

module.exports = router;

