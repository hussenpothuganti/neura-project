const express = require('express');
const router = express.Router();
const BookingModel = require('../models/BookingModel');
const JSONStorage = require('../utils/jsonStorage');

// Initialize booking model and storage
const bookingModel = new BookingModel();
const storage = new JSONStorage();

// POST /api/book - Create a new booking
router.post('/', async (req, res) => {
  try {
    const { userId, bookingData } = req.body;

    if (!userId || !bookingData) {
      return res.status(400).json({
        error: 'userId and bookingData are required',
        success: false
      });
    }

    // Validate booking data
    const validatedBooking = bookingModel.validateBooking(bookingData);
    
    // Generate booking confirmation
    const booking = bookingModel.generateBookingConfirmation(validatedBooking, userId);
    
    // Save to storage
    const savedBooking = await storage.saveBooking(booking);
    
    if (!savedBooking) {
      throw new Error('Failed to save booking');
    }

    res.status(201).json({
      success: true,
      booking: savedBooking,
      message: `${bookingData.type} booking created successfully`
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create booking',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/book/:bookingId - Get specific booking
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await storage.getBooking(bookingId);

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
        success: false
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      error: 'Failed to retrieve booking',
      success: false
    });
  }
});

// GET /api/book/user/:userId - Get all bookings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type, limit = 50 } = req.query;

    let bookings = await storage.getUserBookings(userId);

    // Apply filters
    if (status) {
      bookings = bookings.filter(booking => booking.status === status);
    }

    if (type) {
      bookings = bookings.filter(booking => booking.type === type);
    }

    // Sort by creation date (newest first)
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    bookings = bookings.slice(0, parseInt(limit));

    res.json({
      success: true,
      bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user bookings',
      success: false
    });
  }
});

// PUT /api/book/:bookingId - Update booking
router.put('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { updates, userId } = req.body;

    // Get existing booking
    const existingBooking = await storage.getBooking(bookingId);
    
    if (!existingBooking) {
      return res.status(404).json({
        error: 'Booking not found',
        success: false
      });
    }

    // Check if user owns the booking
    if (existingBooking.userId !== userId) {
      return res.status(403).json({
        error: 'Unauthorized to update this booking',
        success: false
      });
    }

    // Validate updates if they contain booking data changes
    let validatedUpdates = updates;
    if (updates.bookingData) {
      validatedUpdates = {
        ...updates,
        ...bookingModel.validateBooking({
          type: existingBooking.type,
          ...updates.bookingData
        })
      };
      delete validatedUpdates.bookingData;
    }

    // Update booking
    const updatedBooking = await storage.updateBooking(bookingId, validatedUpdates);

    if (!updatedBooking) {
      throw new Error('Failed to update booking');
    }

    res.json({
      success: true,
      booking: updatedBooking,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update booking',
      success: false
    });
  }
});

// DELETE /api/book/:bookingId - Cancel/Delete booking
router.delete('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId, reason = 'User cancellation' } = req.body;

    // Get existing booking
    const existingBooking = await storage.getBooking(bookingId);
    
    if (!existingBooking) {
      return res.status(404).json({
        error: 'Booking not found',
        success: false
      });
    }

    // Check if user owns the booking
    if (existingBooking.userId !== userId) {
      return res.status(403).json({
        error: 'Unauthorized to cancel this booking',
        success: false
      });
    }

    // Update status to cancelled instead of deleting
    const cancelledBooking = await storage.updateBooking(bookingId, {
      status: bookingModel.bookingStatus.CANCELLED,
      cancellationReason: reason,
      cancelledAt: new Date().toISOString()
    });

    if (!cancelledBooking) {
      throw new Error('Failed to cancel booking');
    }

    res.json({
      success: true,
      booking: cancelledBooking,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(400).json({
      error: error.message || 'Failed to cancel booking',
      success: false
    });
  }
});

// POST /api/book/search - Search bookings
router.post('/search', async (req, res) => {
  try {
    const { criteria, userId } = req.body;

    if (!criteria) {
      return res.status(400).json({
        error: 'Search criteria are required',
        success: false
      });
    }

    // Add userId to criteria if provided
    const searchCriteria = userId ? { ...criteria, userId } : criteria;

    const bookings = await storage.searchBookings(searchCriteria);

    res.json({
      success: true,
      bookings,
      count: bookings.length,
      criteria: searchCriteria
    });

  } catch (error) {
    console.error('Search bookings error:', error);
    res.status(500).json({
      error: 'Failed to search bookings',
      success: false
    });
  }
});

// GET /api/book/stats/:userId - Get booking statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await storage.getBookingStats(userId);

    if (!stats) {
      throw new Error('Failed to retrieve booking statistics');
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve booking statistics',
      success: false
    });
  }
});

// POST /api/book/simulate - Simulate booking availability and prices
router.post('/simulate', async (req, res) => {
  try {
    const { bookingData } = req.body;

    if (!bookingData) {
      return res.status(400).json({
        error: 'Booking data is required for simulation',
        success: false
      });
    }

    // Validate the booking data
    const validatedBooking = bookingModel.validateBooking(bookingData);

    // Generate multiple options with different prices and times
    const options = [];
    const basePrice = validatedBooking.estimatedPrice;

    // Generate 3-5 different options
    for (let i = 0; i < Math.min(5, Math.max(3, Math.floor(Math.random() * 3) + 3)); i++) {
      const priceVariation = 0.8 + (Math.random() * 0.4); // ±20% price variation
      const timeVariation = Math.floor(Math.random() * 4) - 2; // ±2 hours

      options.push({
        optionId: `OPT${i + 1}`,
        ...validatedBooking,
        estimatedPrice: Math.round(basePrice * priceVariation),
        timeVariation: timeVariation,
        availability: Math.random() > 0.1 ? 'available' : 'limited', // 90% available
        operator: generateRandomOperator(validatedBooking.type),
        features: generateRandomFeatures(validatedBooking.type)
      });
    }

    // Sort by price
    options.sort((a, b) => a.estimatedPrice - b.estimatedPrice);

    res.json({
      success: true,
      options,
      searchCriteria: bookingData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Booking simulation error:', error);
    res.status(400).json({
      error: error.message || 'Failed to simulate booking options',
      success: false
    });
  }
});

// User preferences endpoints
router.post('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    const success = await storage.saveUserPreferences(userId, preferences);

    if (!success) {
      throw new Error('Failed to save user preferences');
    }

    res.json({
      success: true,
      message: 'User preferences saved successfully'
    });

  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({
      error: 'Failed to save user preferences',
      success: false
    });
  }
});

router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await storage.getUserPreferences(userId);

    res.json({
      success: true,
      preferences: preferences || {}
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user preferences',
      success: false
    });
  }
});

// Helper functions
function generateRandomOperator(type) {
  const operators = {
    bus: ['RedBus Express', 'VRL Travels', 'SRS Travels', 'Orange Travels', 'Neeta Travels'],
    train: ['Indian Railways', 'Rajdhani Express', 'Shatabdi Express', 'Duronto Express'],
    flight: ['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'GoAir']
  };
  
  const typeOperators = operators[type] || ['Generic Operator'];
  return typeOperators[Math.floor(Math.random() * typeOperators.length)];
}

function generateRandomFeatures(type) {
  const features = {
    bus: ['AC', 'WiFi', 'Charging Points', 'Entertainment', 'Blanket'],
    train: ['AC', 'Meals Included', 'Bedding', 'WiFi', 'Pantry Car'],
    flight: ['In-flight Meals', 'Entertainment', 'WiFi', 'Extra Legroom', 'Priority Boarding']
  };
  
  const typeFeatures = features[type] || [];
  const selectedFeatures = [];
  
  // Randomly select 2-4 features
  const featureCount = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < featureCount && i < typeFeatures.length; i++) {
    const randomFeature = typeFeatures[Math.floor(Math.random() * typeFeatures.length)];
    if (!selectedFeatures.includes(randomFeature)) {
      selectedFeatures.push(randomFeature);
    }
  }
  
  return selectedFeatures;
}

module.exports = router;

