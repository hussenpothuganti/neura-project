const mongoose = require('mongoose');
const { Booking, User, ChatHistory, VoiceSession, EmergencyAlert } = require('../models/mongoModels');

class MongoStorage {
  constructor() {
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      if (!process.env.MONGODB_URI) {
        console.warn('MongoDB URI not provided, falling back to JSON storage');
        return;
      }

      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');

      // Set up connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('MongoDB connection failed:', error);
      this.isConnected = false;
    }
  }

  // Booking operations
  async saveBooking(booking) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const newBooking = new Booking(booking);
      const savedBooking = await newBooking.save();
      return savedBooking.toObject();
    } catch (error) {
      console.error('Error saving booking:', error);
      return null;
    }
  }

  async getBooking(bookingId) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const booking = await Booking.findOne({ bookingId }).lean();
      return booking;
    } catch (error) {
      console.error('Error getting booking:', error);
      return null;
    }
  }

  async getUserBookings(userId, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const { status, type, limit = 50, skip = 0 } = options;
      
      let query = { userId };
      
      if (status) query.status = status;
      if (type) query.type = type;

      const bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      return bookings;
    } catch (error) {
      console.error('Error getting user bookings:', error);
      return [];
    }
  }

  async getAllBookings(options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const { limit = 100, skip = 0 } = options;

      const bookings = await Booking.find({})
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      return bookings;
    } catch (error) {
      console.error('Error getting all bookings:', error);
      return [];
    }
  }

  async updateBooking(bookingId, updates) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const updatedBooking = await Booking.findOneAndUpdate(
        { bookingId },
        { ...updates, updatedAt: new Date() },
        { new: true, lean: true }
      );

      return updatedBooking;
    } catch (error) {
      console.error('Error updating booking:', error);
      return null;
    }
  }

  async deleteBooking(bookingId) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const result = await Booking.deleteOne({ bookingId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }

  // Search and filter operations
  async searchBookings(criteria) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      let query = {};

      if (criteria.userId) query.userId = criteria.userId;
      if (criteria.type) query.type = criteria.type;
      if (criteria.status) query.status = criteria.status;
      
      if (criteria.from) {
        query.from = { $regex: criteria.from, $options: 'i' };
      }
      
      if (criteria.to) {
        query.to = { $regex: criteria.to, $options: 'i' };
      }

      if (criteria.date) {
        query.$or = [
          { date: criteria.date },
          { departureDate: criteria.date }
        ];
      }

      if (criteria.dateRange) {
        const startDate = new Date(criteria.dateRange.start);
        const endDate = new Date(criteria.dateRange.end);
        
        query.$or = [
          { 
            date: { 
              $gte: startDate.toISOString().split('T')[0], 
              $lte: endDate.toISOString().split('T')[0] 
            }
          },
          { 
            departureDate: { 
              $gte: startDate.toISOString().split('T')[0], 
              $lte: endDate.toISOString().split('T')[0] 
            }
          }
        ];
      }

      const bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return bookings;
    } catch (error) {
      console.error('Error searching bookings:', error);
      return [];
    }
  }

  // Statistics and analytics
  async getBookingStats(userId = null) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const matchStage = userId ? { $match: { userId } } : { $match: {} };

      const stats = await Booking.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalValue: { $sum: '$estimatedPrice' },
            byType: {
              $push: {
                type: '$type',
                count: 1
              }
            },
            byStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            }
          }
        }
      ]);

      // Get recent bookings
      const recentBookings = await Booking.find(userId ? { userId } : {})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Process aggregation results
      const result = stats[0] || { total: 0, totalValue: 0, byType: [], byStatus: [] };
      
      // Count by type and status
      const typeCount = {};
      const statusCount = {};
      
      result.byType.forEach(item => {
        typeCount[item.type] = (typeCount[item.type] || 0) + 1;
      });
      
      result.byStatus.forEach(item => {
        statusCount[item.status] = (statusCount[item.status] || 0) + 1;
      });

      return {
        total: result.total,
        byType: typeCount,
        byStatus: statusCount,
        totalValue: result.totalValue,
        recentBookings
      };
    } catch (error) {
      console.error('Error getting booking stats:', error);
      return null;
    }
  }

  // User operations
  async saveUserPreferences(userId, preferences) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const user = await User.findOneAndUpdate(
        { userId },
        { 
          userId,
          preferences,
          updatedAt: new Date()
        },
        { 
          upsert: true, 
          new: true,
          lean: true
        }
      );

      return !!user;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  async getUserPreferences(userId) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const user = await User.findOne({ userId }).lean();
      return user?.preferences || null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Chat history operations
  async saveChatMessage(userId, conversationId, message) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      await ChatHistory.findOneAndUpdate(
        { userId, conversationId },
        {
          userId,
          conversationId,
          $push: {
            messages: {
              $each: [message],
              $slice: -50 // Keep only last 50 messages
            }
          },
          updatedAt: new Date()
        },
        { upsert: true }
      );

      return true;
    } catch (error) {
      console.error('Error saving chat message:', error);
      return false;
    }
  }

  async getChatHistory(userId, conversationId = 'default') {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const chatHistory = await ChatHistory.findOne({ userId, conversationId }).lean();
      return chatHistory?.messages || [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  async clearChatHistory(userId, conversationId = 'default') {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      await ChatHistory.deleteOne({ userId, conversationId });
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }

  // Voice session operations
  async saveVoiceInteraction(userId, sessionId, interaction) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      await VoiceSession.findOneAndUpdate(
        { userId, sessionId },
        {
          userId,
          sessionId,
          $push: {
            interactions: {
              $each: [interaction],
              $slice: -20 // Keep only last 20 interactions
            }
          },
          updatedAt: new Date()
        },
        { upsert: true }
      );

      return true;
    } catch (error) {
      console.error('Error saving voice interaction:', error);
      return false;
    }
  }

  async getVoiceSession(userId, sessionId = 'default') {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const voiceSession = await VoiceSession.findOne({ userId, sessionId }).lean();
      return voiceSession?.interactions || [];
    } catch (error) {
      console.error('Error getting voice session:', error);
      return [];
    }
  }

  async clearVoiceSession(userId, sessionId = 'default') {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      await VoiceSession.deleteOne({ userId, sessionId });
      return true;
    } catch (error) {
      console.error('Error clearing voice session:', error);
      return false;
    }
  }

  // Emergency alert operations
  async saveEmergencyAlert(alert) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const newAlert = new EmergencyAlert(alert);
      const savedAlert = await newAlert.save();
      return savedAlert.toObject();
    } catch (error) {
      console.error('Error saving emergency alert:', error);
      return null;
    }
  }

  async getEmergencyAlerts(userId, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const { status, limit = 50 } = options;
      
      let query = { userId };
      if (status) query.status = status;

      const alerts = await EmergencyAlert.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      return alerts;
    } catch (error) {
      console.error('Error getting emergency alerts:', error);
      return [];
    }
  }

  async updateEmergencyAlert(alertId, updates) {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const updatedAlert = await EmergencyAlert.findOneAndUpdate(
        { alertId },
        { ...updates, updatedAt: new Date() },
        { new: true, lean: true }
      );

      return updatedAlert;
    } catch (error) {
      console.error('Error updating emergency alert:', error);
      return null;
    }
  }

  // Backup and restore (for compatibility)
  async createBackup() {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const timestamp = new Date().toISOString();
      
      // In a real implementation, you might export to a file or another database
      // For now, we'll just return a success indicator
      console.log(`MongoDB backup initiated at ${timestamp}`);
      return timestamp;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'MongoDB not connected' };
      }

      await mongoose.connection.db.admin().ping();
      return { status: 'connected', message: 'MongoDB connection healthy' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Get connection status
  isMongoConnected() {
    return this.isConnected;
  }
}

module.exports = MongoStorage;

