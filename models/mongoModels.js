const mongoose = require('mongoose');

// Booking Schema
const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bus', 'train', 'flight']
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: function() {
      return this.type === 'bus' || this.type === 'train';
    }
  },
  departureDate: {
    type: String,
    required: function() {
      return this.type === 'flight';
    }
  },
  returnDate: {
    type: String,
    required: false
  },
  time: {
    type: String,
    required: function() {
      return this.type === 'bus' || this.type === 'train';
    }
  },
  passengers: [{
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['infant', 'child', 'adult', 'senior'],
      default: 'adult'
    },
    id: {
      type: String,
      required: false
    }
  }],
  class: {
    type: String,
    required: function() {
      return this.type === 'train' || this.type === 'flight';
    }
  },
  seatType: {
    type: String,
    required: function() {
      return this.type === 'bus';
    }
  },
  estimatedPrice: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  confirmationCode: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  operator: {
    type: String,
    required: false
  },
  features: [{
    type: String
  }],
  cancellationReason: {
    type: String,
    required: false
  },
  cancelledAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// User Schema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  profile: {
    name: String,
    email: String,
    phone: String,
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String
    }]
  },
  settings: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    voiceSettings: {
      wakeWord: {
        type: String,
        default: 'neura'
      },
      voiceEnabled: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Chat History Schema
const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    default: 'default'
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text'
    },
    metadata: {
      source: String,
      model: String,
      confidence: Number,
      commandType: String
    }
  }]
}, {
  timestamps: true
});

// Voice Session Schema
const voiceSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    default: 'default'
  },
  interactions: [{
    transcript: {
      type: String,
      required: true
    },
    response: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true
    },
    commandType: {
      type: String,
      required: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Emergency Alert Schema
const emergencyAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['medical', 'fire', 'police', 'general']
  },
  location: {
    type: String,
    required: false
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  additionalInfo: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  responders: [{
    name: String,
    contact: String,
    type: String,
    notifiedAt: Date,
    respondedAt: Date
  }],
  resolvedAt: {
    type: Date,
    required: false
  },
  resolution: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Create indexes for better performance
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ type: 1 });
bookingSchema.index({ 'from': 'text', 'to': 'text' });

userSchema.index({ userId: 1 });

chatHistorySchema.index({ userId: 1, conversationId: 1 });
chatHistorySchema.index({ 'messages.timestamp': -1 });

voiceSessionSchema.index({ userId: 1, sessionId: 1 });
voiceSessionSchema.index({ 'interactions.timestamp': -1 });

emergencyAlertSchema.index({ userId: 1, createdAt: -1 });
emergencyAlertSchema.index({ status: 1 });
emergencyAlertSchema.index({ priority: 1 });

// Create models
const Booking = mongoose.model('Booking', bookingSchema);
const User = mongoose.model('User', userSchema);
const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
const VoiceSession = mongoose.model('VoiceSession', voiceSessionSchema);
const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

module.exports = {
  Booking,
  User,
  ChatHistory,
  VoiceSession,
  EmergencyAlert
};

