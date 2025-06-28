const fs = require('fs').promises;
const path = require('path');
const MongoStorage = require('./mongoStorage');

class JSONStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.bookingsFile = path.join(this.dataDir, 'bookings.json');
    this.usersFile = path.join(this.dataDir, 'users.json');
    
    // Initialize MongoDB storage
    this.mongoStorage = new MongoStorage();
    
    this.init();
  }

  async init() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize files if they don't exist
      await this.initFile(this.bookingsFile, []);
      await this.initFile(this.usersFile, {});
      
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  // Use MongoDB if available, otherwise fall back to JSON
  async useStorage(operation, ...args) {
    try {
      if (this.mongoStorage.isMongoConnected()) {
        return await this.mongoStorage[operation](...args);
      } else {
        // Fall back to JSON storage
        return await this[`_json_${operation}`](...args);
      }
    } catch (error) {
      console.error(`Storage operation ${operation} failed:`, error);
      // Try JSON fallback if MongoDB fails
      if (this.mongoStorage.isMongoConnected()) {
        try {
          return await this[`_json_${operation}`](...args);
        } catch (jsonError) {
          console.error(`JSON fallback also failed:`, jsonError);
          return null;
        }
      }
      return null;
    }
  }

  async initFile(filePath, defaultData) {
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      return false;
    }
  }

  // Booking operations - use MongoDB if available, JSON as fallback
  async saveBooking(booking) {
    return await this.useStorage('saveBooking', booking);
  }

  async getBooking(bookingId) {
    return await this.useStorage('getBooking', bookingId);
  }

  async getUserBookings(userId, options = {}) {
    return await this.useStorage('getUserBookings', userId, options);
  }

  async getAllBookings(options = {}) {
    return await this.useStorage('getAllBookings', options);
  }

  async updateBooking(bookingId, updates) {
    return await this.useStorage('updateBooking', bookingId, updates);
  }

  async deleteBooking(bookingId) {
    return await this.useStorage('deleteBooking', bookingId);
  }

  async searchBookings(criteria) {
    return await this.useStorage('searchBookings', criteria);
  }

  async getBookingStats(userId = null) {
    return await this.useStorage('getBookingStats', userId);
  }

  async saveUserPreferences(userId, preferences) {
    return await this.useStorage('saveUserPreferences', userId, preferences);
  }

  async getUserPreferences(userId) {
    return await this.useStorage('getUserPreferences', userId);
  }

  // JSON fallback methods (prefixed with _json_)
  async _json_saveBooking(booking) {
    try {
      const bookings = await this.readFile(this.bookingsFile) || [];
      bookings.push(booking);
      
      const success = await this.writeFile(this.bookingsFile, bookings);
      return success ? booking : null;
    } catch (error) {
      console.error('Error saving booking:', error);
      return null;
    }
  }

  async getBooking(bookingId) {
    try {
      const bookings = await this.readFile(this.bookingsFile) || [];
      return bookings.find(booking => booking.bookingId === bookingId) || null;
    } catch (error) {
      console.error('Error getting booking:', error);
      return null;
    }
  }

  async _json_getUserBookings(userId, options = {}) {
    try {
      const bookings = await this.readFile(this.bookingsFile) || [];
      let userBookings = bookings.filter(booking => booking.userId === userId);
      
      // Apply filters
      if (options.status) {
        userBookings = userBookings.filter(booking => booking.status === options.status);
      }
      
      if (options.type) {
        userBookings = userBookings.filter(booking => booking.type === options.type);
      }
      
      // Sort and limit
      userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (options.limit) {
        userBookings = userBookings.slice(0, parseInt(options.limit));
      }
      
      return userBookings;
    } catch (error) {
      console.error('Error getting user bookings:', error);
      return [];
    }
  }

  async _json_getAllBookings(options = {}) {
    try {
      return await this.readFile(this.bookingsFile) || [];
    } catch (error) {
      console.error('Error getting all bookings:', error);
      return [];
    }
  }

  async _json_updateBooking(bookingId, updates) {
    try {
      const bookings = await this.readFile(this.bookingsFile) || [];
      const bookingIndex = bookings.findIndex(booking => booking.bookingId === bookingId);
      
      if (bookingIndex === -1) {
        return null;
      }

      bookings[bookingIndex] = {
        ...bookings[bookingIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const success = await this.writeFile(this.bookingsFile, bookings);
      return success ? bookings[bookingIndex] : null;
    } catch (error) {
      console.error('Error updating booking:', error);
      return null;
    }
  }

  async _json_deleteBooking(bookingId) {
    try {
      const bookings = await this.readFile(this.bookingsFile) || [];
      const filteredBookings = bookings.filter(booking => booking.bookingId !== bookingId);
      
      if (filteredBookings.length === bookings.length) {
        return false; // Booking not found
      }

      return await this.writeFile(this.bookingsFile, filteredBookings);
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }

  // Search and filter operations
  async _json_searchBookings(criteria) {
    try {
      const bookings = await this.readFile(this.bookingsFile) || [];
      
      return bookings.filter(booking => {
        let matches = true;

        if (criteria.userId && booking.userId !== criteria.userId) {
          matches = false;
        }

        if (criteria.type && booking.type !== criteria.type) {
          matches = false;
        }

        if (criteria.status && booking.status !== criteria.status) {
          matches = false;
        }

        if (criteria.from && !booking.from.toLowerCase().includes(criteria.from.toLowerCase())) {
          matches = false;
        }

        if (criteria.to && !booking.to.toLowerCase().includes(criteria.to.toLowerCase())) {
          matches = false;
        }

        if (criteria.date && booking.date !== criteria.date && booking.departureDate !== criteria.date) {
          matches = false;
        }

        if (criteria.dateRange) {
          const bookingDate = new Date(booking.date || booking.departureDate);
          const startDate = new Date(criteria.dateRange.start);
          const endDate = new Date(criteria.dateRange.end);
          
          if (bookingDate < startDate || bookingDate > endDate) {
            matches = false;
          }
        }

        return matches;
      });
    } catch (error) {
      console.error('Error searching bookings:', error);
      return [];
    }
  }

  // Statistics and analytics
  async _json_getBookingStats(userId = null) {
    try {
      const bookings = userId ? 
        await this._json_getUserBookings(userId) : 
        await this._json_getAllBookings();

      const stats = {
        total: bookings.length,
        byType: {},
        byStatus: {},
        totalValue: 0,
        recentBookings: bookings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      };

      bookings.forEach(booking => {
        // Count by type
        stats.byType[booking.type] = (stats.byType[booking.type] || 0) + 1;
        
        // Count by status
        stats.byStatus[booking.status] = (stats.byStatus[booking.status] || 0) + 1;
        
        // Sum total value
        stats.totalValue += booking.estimatedPrice || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error getting booking stats:', error);
      return null;
    }
  }

  // User preferences (simple storage)
  async _json_saveUserPreferences(userId, preferences) {
    try {
      const users = await this.readFile(this.usersFile) || {};
      users[userId] = {
        ...users[userId],
        preferences,
        updatedAt: new Date().toISOString()
      };
      
      return await this.writeFile(this.usersFile, users);
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  async _json_getUserPreferences(userId) {
    try {
      const users = await this.readFile(this.usersFile) || {};
      return users[userId]?.preferences || null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Health check method
  async healthCheck() {
    if (this.mongoStorage.isMongoConnected()) {
      return await this.mongoStorage.healthCheck();
    } else {
      return { 
        status: 'json_fallback', 
        message: 'Using JSON file storage (MongoDB not available)' 
      };
    }
  }

  // Backup and restore
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.dataDir, 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const bookings = await this.readFile(this.bookingsFile);
      const users = await this.readFile(this.usersFile);
      
      const backupData = {
        timestamp,
        bookings,
        users
      };
      
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      
      return backupFile;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  async restoreFromBackup(backupFile) {
    try {
      const backupData = await this.readFile(backupFile);
      
      if (backupData.bookings) {
        await this.writeFile(this.bookingsFile, backupData.bookings);
      }
      
      if (backupData.users) {
        await this.writeFile(this.usersFile, backupData.users);
      }
      
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }
}

module.exports = JSONStorage;

