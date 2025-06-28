const AIService = require('../utils/aiService');
const BookingModel = require('../models/BookingModel');
const JSONStorage = require('../utils/jsonStorage');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.aiService = new AIService();
    this.bookingModel = new BookingModel();
    this.storage = new JSONStorage();
    this.activeUsers = new Map();
    this.voiceSessions = new Map();
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);
      
      // Handle user authentication/identification
      socket.on('user-connect', (userData) => {
        this.handleUserConnect(socket, userData);
      });

      // Chat message handlers
      socket.on('chat-message', (data) => {
        this.handleChatMessage(socket, data);
      });

      socket.on('chat-stream-request', (data) => {
        this.handleChatStreamRequest(socket, data);
      });

      // Voice command handlers
      socket.on('voice-command', (data) => {
        this.handleVoiceCommand(socket, data);
      });

      socket.on('voice-stream', (data) => {
        this.handleVoiceStream(socket, data);
      });

      socket.on('wake-word-detected', (data) => {
        this.handleWakeWordDetection(socket, data);
      });

      // Booking handlers
      socket.on('booking-request', (data) => {
        this.handleBookingRequest(socket, data);
      });

      socket.on('booking-simulation', (data) => {
        this.handleBookingSimulation(socket, data);
      });

      socket.on('booking-confirmation', (data) => {
        this.handleBookingConfirmation(socket, data);
      });

      // Emergency handlers
      socket.on('emergency-alert', (data) => {
        this.handleEmergencyAlert(socket, data);
      });

      // Real-time status updates
      socket.on('request-status-update', (data) => {
        this.handleStatusUpdate(socket, data);
      });

      // Typing indicators
      socket.on('typing-start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing-stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleUserConnect(socket, userData) {
    try {
      const { userId, sessionId, preferences = {} } = userData;
      
      if (!userId) {
        socket.emit('connection-error', { error: 'userId is required' });
        return;
      }

      // Store user information
      this.activeUsers.set(socket.id, {
        userId,
        sessionId: sessionId || 'default',
        preferences,
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });

      // Join user to their personal room
      socket.join(userId);
      socket.join(`${userId}_${sessionId || 'default'}`);

      console.log(`👤 User ${userId} connected with session ${sessionId || 'default'}`);

      // Send connection confirmation
      socket.emit('connection-confirmed', {
        userId,
        sessionId: sessionId || 'default',
        timestamp: new Date().toISOString(),
        features: ['chat', 'voice', 'booking', 'emergency']
      });

      // Send any pending notifications
      this.sendPendingNotifications(socket, userId);

    } catch (error) {
      console.error('User connect error:', error);
      socket.emit('connection-error', { error: 'Failed to establish connection' });
    }
  }

  async handleChatMessage(socket, data) {
    try {
      const { message, userId, conversationId, useReasoner = false } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('chat-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // Update last activity
      userInfo.lastActivity = new Date().toISOString();

      // Emit processing status
      socket.emit('chat-processing', {
        message: 'Processing your message...',
        timestamp: new Date().toISOString()
      });

      // Get conversation context (you might want to implement this)
      const context = []; // Implement context retrieval

      // Determine if we should use reasoner model
      const shouldUseReasoner = useReasoner || this.aiService.shouldUseReasoner(message);

      // Process the message
      const result = await this.aiService.processMessage(message, context, shouldUseReasoner);

      // Emit response to user
      socket.emit('chat-response', {
        message: result.response,
        source: result.source,
        model: result.model,
        timestamp: result.timestamp,
        usage: result.usage,
        conversationId: conversationId || 'default'
      });

      // Broadcast to user's other sessions if needed
      socket.to(userId).emit('chat-sync', {
        message,
        response: result.response,
        timestamp: result.timestamp
      });

    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('chat-error', {
        error: 'Failed to process message',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleChatStreamRequest(socket, data) {
    try {
      const { message, userId, conversationId } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('chat-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // Update last activity
      userInfo.lastActivity = new Date().toISOString();

      // Get conversation context
      const context = []; // Implement context retrieval

      let fullResponse = '';

      // Stream the response
      await this.aiService.streamResponse(message, context, (chunk, isComplete) => {
        if (!isComplete) {
          fullResponse += chunk;
          socket.emit('chat-stream-chunk', {
            chunk,
            timestamp: new Date().toISOString()
          });
        } else {
          socket.emit('chat-stream-complete', {
            fullResponse,
            timestamp: new Date().toISOString(),
            conversationId: conversationId || 'default'
          });
        }
      });

    } catch (error) {
      console.error('Chat stream error:', error);
      socket.emit('chat-stream-error', {
        error: 'Failed to stream response',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleVoiceCommand(socket, data) {
    try {
      const { transcript, userId, sessionId, confidence, language = 'en' } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('voice-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // Update last activity
      userInfo.lastActivity = new Date().toISOString();

      // Check confidence level
      if (confidence && confidence < 0.7) {
        socket.emit('voice-response', {
          response: "I didn't quite catch that. Could you please repeat?",
          confidence: confidence,
          timestamp: new Date().toISOString(),
          requiresRepeat: true,
          shouldSpeak: true
        });
        return;
      }

      // Get voice session context
      const contextKey = `${userId}_${sessionId || 'default'}`;
      let context = this.voiceSessions.get(contextKey) || [];

      // Process voice command
      const result = await this.aiService.processMessage(transcript, context);

      // Update voice session context
      context.push(
        { role: 'user', content: transcript, type: 'voice' },
        { role: 'assistant', content: result.response, type: 'voice' }
      );

      if (context.length > 20) {
        context = context.slice(-20);
      }
      this.voiceSessions.set(contextKey, context);

      // Detect command type
      const commandType = this.detectCommandType(transcript);

      // Emit response
      socket.emit('voice-response', {
        response: result.response,
        source: result.source,
        model: result.model,
        timestamp: result.timestamp,
        commandType: commandType,
        confidence: confidence || 1.0,
        shouldSpeak: true,
        language: language
      });

      // Handle special commands
      if (commandType === 'booking') {
        this.handleVoiceBookingCommand(socket, transcript, userId);
      } else if (commandType === 'emergency') {
        this.handleVoiceEmergencyCommand(socket, transcript, userId);
      }

    } catch (error) {
      console.error('Voice command error:', error);
      socket.emit('voice-error', {
        error: 'Failed to process voice command',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleVoiceStream(socket, data) {
    try {
      const { audioData, userId, sessionId, isComplete } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('voice-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // In a real implementation, you would process the audio stream here
      // For now, we'll just acknowledge the stream
      socket.emit('voice-stream-ack', {
        received: true,
        timestamp: new Date().toISOString(),
        isComplete
      });

      if (isComplete) {
        // Process the complete audio stream
        socket.emit('voice-stream-processed', {
          message: 'Audio processing complete',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Voice stream error:', error);
      socket.emit('voice-stream-error', {
        error: 'Failed to process voice stream',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleWakeWordDetection(socket, data) {
    try {
      const { wakeWord, userId, confidence } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('wake-word-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      console.log(`🗣️ Wake word "${wakeWord}" detected for user ${userId} with confidence ${confidence}`);

      // Handle wake word
      const response = await this.handleWakeWord(wakeWord, userId);

      socket.emit('wake-word-response', {
        ...response,
        timestamp: new Date().toISOString(),
        isListening: true
      });

    } catch (error) {
      console.error('Wake word error:', error);
      socket.emit('wake-word-error', {
        error: 'Failed to process wake word',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleBookingRequest(socket, data) {
    try {
      const { bookingData, userId } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('booking-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // Update last activity
      userInfo.lastActivity = new Date().toISOString();

      // Emit processing status
      socket.emit('booking-processing', {
        message: 'Processing your booking request...',
        timestamp: new Date().toISOString()
      });

      // Validate booking data
      const validatedBooking = this.bookingModel.validateBooking(bookingData);
      
      // Generate booking confirmation
      const booking = this.bookingModel.generateBookingConfirmation(validatedBooking, userId);
      
      // Save to storage
      const savedBooking = await this.storage.saveBooking(booking);

      if (!savedBooking) {
        throw new Error('Failed to save booking');
      }

      // Emit success response
      socket.emit('booking-confirmed', {
        booking: savedBooking,
        message: `${bookingData.type} booking confirmed successfully`,
        timestamp: new Date().toISOString()
      });

      // Send confirmation to all user sessions
      socket.to(userId).emit('booking-notification', {
        type: 'booking_confirmed',
        booking: savedBooking,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Booking request error:', error);
      socket.emit('booking-error', {
        error: error.message || 'Failed to process booking request',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleBookingSimulation(socket, data) {
    try {
      const { bookingData, userId } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('booking-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // Validate the booking data
      const validatedBooking = this.bookingModel.validateBooking(bookingData);

      // Generate multiple options
      const options = this.generateBookingOptions(validatedBooking);

      socket.emit('booking-options', {
        options,
        searchCriteria: bookingData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Booking simulation error:', error);
      socket.emit('booking-error', {
        error: error.message || 'Failed to simulate booking options',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleBookingConfirmation(socket, data) {
    try {
      const { optionId, bookingData, userId } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('booking-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // Process the booking confirmation
      const booking = this.bookingModel.generateBookingConfirmation(bookingData, userId);
      const savedBooking = await this.storage.saveBooking(booking);

      if (!savedBooking) {
        throw new Error('Failed to confirm booking');
      }

      socket.emit('booking-confirmed', {
        booking: savedBooking,
        message: 'Booking confirmed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Booking confirmation error:', error);
      socket.emit('booking-error', {
        error: error.message || 'Failed to confirm booking',
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleEmergencyAlert(socket, data) {
    try {
      const { emergencyType, location, additionalInfo, userId } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('emergency-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      console.log(`🚨 EMERGENCY ALERT: ${emergencyType} for user ${userId} at ${location}`);

      const emergency = {
        userId,
        type: emergencyType,
        location,
        additionalInfo,
        timestamp: new Date().toISOString(),
        status: 'active',
        alertId: `EMG${Date.now()}`
      };

      // Emit emergency response
      socket.emit('emergency-response', {
        message: `Emergency alert activated for ${emergencyType}. Help is on the way. Stay calm and safe.`,
        emergency,
        timestamp: new Date().toISOString(),
        priority: 'critical'
      });

      // Broadcast to all admin/monitoring sessions (if implemented)
      this.io.emit('emergency-broadcast', {
        emergency,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Emergency alert error:', error);
      socket.emit('emergency-error', {
        error: 'Failed to process emergency alert',
        timestamp: new Date().toISOString()
      });
    }
  }

  handleStatusUpdate(socket, data) {
    try {
      const { userId } = data;
      const userInfo = this.activeUsers.get(socket.id);

      if (!userInfo || userInfo.userId !== userId) {
        socket.emit('status-error', { error: 'Unauthorized or invalid session' });
        return;
      }

      // Send current status
      socket.emit('status-update', {
        userId,
        isOnline: true,
        lastActivity: userInfo.lastActivity,
        sessionId: userInfo.sessionId,
        features: ['chat', 'voice', 'booking', 'emergency'],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Status update error:', error);
      socket.emit('status-error', {
        error: 'Failed to get status update',
        timestamp: new Date().toISOString()
      });
    }
  }

  handleTypingStart(socket, data) {
    const { userId, conversationId } = data;
    socket.to(`${userId}_${conversationId || 'default'}`).emit('user-typing', {
      userId,
      isTyping: true,
      timestamp: new Date().toISOString()
    });
  }

  handleTypingStop(socket, data) {
    const { userId, conversationId } = data;
    socket.to(`${userId}_${conversationId || 'default'}`).emit('user-typing', {
      userId,
      isTyping: false,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(socket) {
    const userInfo = this.activeUsers.get(socket.id);
    if (userInfo) {
      console.log(`👋 User ${userInfo.userId} disconnected`);
      this.activeUsers.delete(socket.id);
    }
    console.log(`🔌 Client disconnected: ${socket.id}`);
  }

  // Helper methods

  detectCommandType(transcript) {
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
    
    return 'general';
  }

  async handleWakeWord(wakeWord, userId) {
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
      wakeWord: wakeWord
    };
  }

  async handleVoiceBookingCommand(socket, transcript, userId) {
    // Extract booking information from voice command
    // This is a simplified implementation
    socket.emit('voice-booking-detected', {
      message: 'I detected a booking request. Let me help you with that.',
      transcript,
      timestamp: new Date().toISOString(),
      nextAction: 'show_booking_form'
    });
  }

  async handleVoiceEmergencyCommand(socket, transcript, userId) {
    socket.emit('voice-emergency-detected', {
      message: 'Emergency command detected. Activating emergency protocols.',
      transcript,
      timestamp: new Date().toISOString(),
      priority: 'critical'
    });
  }

  generateBookingOptions(validatedBooking) {
    const options = [];
    const basePrice = validatedBooking.estimatedPrice;

    for (let i = 0; i < 5; i++) {
      const priceVariation = 0.8 + (Math.random() * 0.4);
      options.push({
        optionId: `OPT${i + 1}`,
        ...validatedBooking,
        estimatedPrice: Math.round(basePrice * priceVariation),
        availability: Math.random() > 0.1 ? 'available' : 'limited',
        operator: this.generateRandomOperator(validatedBooking.type),
        features: this.generateRandomFeatures(validatedBooking.type)
      });
    }

    return options.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
  }

  generateRandomOperator(type) {
    const operators = {
      bus: ['RedBus Express', 'VRL Travels', 'SRS Travels', 'Orange Travels'],
      train: ['Indian Railways', 'Rajdhani Express', 'Shatabdi Express'],
      flight: ['Air India', 'IndiGo', 'SpiceJet', 'Vistara']
    };
    
    const typeOperators = operators[type] || ['Generic Operator'];
    return typeOperators[Math.floor(Math.random() * typeOperators.length)];
  }

  generateRandomFeatures(type) {
    const features = {
      bus: ['AC', 'WiFi', 'Charging Points', 'Entertainment'],
      train: ['AC', 'Meals Included', 'Bedding', 'WiFi'],
      flight: ['In-flight Meals', 'Entertainment', 'WiFi', 'Extra Legroom']
    };
    
    const typeFeatures = features[type] || [];
    const selectedFeatures = [];
    const featureCount = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < featureCount && i < typeFeatures.length; i++) {
      const randomFeature = typeFeatures[Math.floor(Math.random() * typeFeatures.length)];
      if (!selectedFeatures.includes(randomFeature)) {
        selectedFeatures.push(randomFeature);
      }
    }
    
    return selectedFeatures;
  }

  async sendPendingNotifications(socket, userId) {
    // Implementation for sending pending notifications
    // This could include unread messages, booking updates, etc.
  }

  // Public methods for external use
  
  broadcastToUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  getActiveUsers() {
    return Array.from(this.activeUsers.values());
  }

  getUserCount() {
    return this.activeUsers.size;
  }
}

module.exports = SocketHandler;

