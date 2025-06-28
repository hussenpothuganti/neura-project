// Booking data models and validation

class BookingModel {
  constructor() {
    this.bookingTypes = {
      BUS: 'bus',
      TRAIN: 'train',
      FLIGHT: 'flight'
    };

    this.bookingStatus = {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed'
    };
  }

  // Validate booking data based on type
  validateBooking(bookingData) {
    const { type, ...data } = bookingData;

    if (!Object.values(this.bookingTypes).includes(type)) {
      throw new Error(`Invalid booking type: ${type}`);
    }

    switch (type) {
      case this.bookingTypes.BUS:
        return this.validateBusBooking(data);
      case this.bookingTypes.TRAIN:
        return this.validateTrainBooking(data);
      case this.bookingTypes.FLIGHT:
        return this.validateFlightBooking(data);
      default:
        throw new Error(`Unsupported booking type: ${type}`);
    }
  }

  validateBusBooking(data) {
    const required = ['from', 'to', 'date', 'time', 'passengers'];
    const optional = ['seatType', 'operatorPreference'];

    this.checkRequiredFields(data, required);

    return {
      type: this.bookingTypes.BUS,
      from: data.from.trim(),
      to: data.to.trim(),
      date: this.validateDate(data.date),
      time: data.time.trim(),
      passengers: this.validatePassengers(data.passengers),
      seatType: data.seatType || 'standard',
      operatorPreference: data.operatorPreference || 'any',
      estimatedPrice: this.calculateBusPrice(data),
      duration: this.estimateBusDuration(data.from, data.to)
    };
  }

  validateTrainBooking(data) {
    const required = ['from', 'to', 'date', 'time', 'passengers', 'class'];
    const optional = ['trainType', 'seatPreference'];

    this.checkRequiredFields(data, required);

    return {
      type: this.bookingTypes.TRAIN,
      from: data.from.trim(),
      to: data.to.trim(),
      date: this.validateDate(data.date),
      time: data.time.trim(),
      passengers: this.validatePassengers(data.passengers),
      class: this.validateTrainClass(data.class),
      trainType: data.trainType || 'express',
      seatPreference: data.seatPreference || 'any',
      estimatedPrice: this.calculateTrainPrice(data),
      duration: this.estimateTrainDuration(data.from, data.to, data.trainType)
    };
  }

  validateFlightBooking(data) {
    const required = ['from', 'to', 'departureDate', 'passengers', 'class'];
    const optional = ['returnDate', 'airlinePreference', 'mealPreference'];

    this.checkRequiredFields(data, required);

    return {
      type: this.bookingTypes.FLIGHT,
      from: data.from.trim(),
      to: data.to.trim(),
      departureDate: this.validateDate(data.departureDate),
      returnDate: data.returnDate ? this.validateDate(data.returnDate) : null,
      passengers: this.validatePassengers(data.passengers),
      class: this.validateFlightClass(data.class),
      airlinePreference: data.airlinePreference || 'any',
      mealPreference: data.mealPreference || 'standard',
      tripType: data.returnDate ? 'round-trip' : 'one-way',
      estimatedPrice: this.calculateFlightPrice(data),
      duration: this.estimateFlightDuration(data.from, data.to)
    };
  }

  checkRequiredFields(data, required) {
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  validateDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      throw new Error('Booking date cannot be in the past');
    }
    
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  validatePassengers(passengers) {
    if (!Array.isArray(passengers) || passengers.length === 0) {
      throw new Error('At least one passenger is required');
    }

    return passengers.map(passenger => {
      if (!passenger.name || !passenger.age) {
        throw new Error('Each passenger must have name and age');
      }
      
      return {
        name: passenger.name.trim(),
        age: parseInt(passenger.age),
        type: this.getPassengerType(passenger.age),
        id: passenger.id || null
      };
    });
  }

  getPassengerType(age) {
    if (age < 2) return 'infant';
    if (age < 12) return 'child';
    if (age >= 60) return 'senior';
    return 'adult';
  }

  validateTrainClass(trainClass) {
    const validClasses = ['sleeper', '3ac', '2ac', '1ac', 'cc', 'ec'];
    if (!validClasses.includes(trainClass.toLowerCase())) {
      throw new Error(`Invalid train class: ${trainClass}`);
    }
    return trainClass.toLowerCase();
  }

  validateFlightClass(flightClass) {
    const validClasses = ['economy', 'premium-economy', 'business', 'first'];
    if (!validClasses.includes(flightClass.toLowerCase())) {
      throw new Error(`Invalid flight class: ${flightClass}`);
    }
    return flightClass.toLowerCase();
  }

  // Price calculation methods (simplified simulation)
  calculateBusPrice(data) {
    const basePrice = 500; // Base price in currency units
    const distanceMultiplier = this.getDistanceMultiplier(data.from, data.to);
    const passengerCount = data.passengers.length;
    const seatTypeMultiplier = data.seatType === 'premium' ? 1.5 : 1;
    
    return Math.round(basePrice * distanceMultiplier * passengerCount * seatTypeMultiplier);
  }

  calculateTrainPrice(data) {
    const basePrices = {
      'sleeper': 300,
      '3ac': 800,
      '2ac': 1200,
      '1ac': 2000,
      'cc': 600,
      'ec': 400
    };
    
    const basePrice = basePrices[data.class] || 500;
    const distanceMultiplier = this.getDistanceMultiplier(data.from, data.to);
    const passengerCount = data.passengers.length;
    
    return Math.round(basePrice * distanceMultiplier * passengerCount);
  }

  calculateFlightPrice(data) {
    const basePrices = {
      'economy': 5000,
      'premium-economy': 8000,
      'business': 15000,
      'first': 25000
    };
    
    const basePrice = basePrices[data.class] || 5000;
    const distanceMultiplier = this.getDistanceMultiplier(data.from, data.to);
    const passengerCount = data.passengers.length;
    const tripMultiplier = data.returnDate ? 1.8 : 1; // Round trip discount
    
    return Math.round(basePrice * distanceMultiplier * passengerCount * tripMultiplier);
  }

  getDistanceMultiplier(from, to) {
    // Simplified distance calculation based on city pairs
    const distances = {
      'delhi-mumbai': 1.5,
      'mumbai-delhi': 1.5,
      'delhi-bangalore': 2.0,
      'bangalore-delhi': 2.0,
      'mumbai-bangalore': 1.2,
      'bangalore-mumbai': 1.2,
      'delhi-kolkata': 1.8,
      'kolkata-delhi': 1.8,
      'mumbai-kolkata': 2.2,
      'kolkata-mumbai': 2.2,
      'bangalore-kolkata': 2.5,
      'kolkata-bangalore': 2.5
    };
    
    const key = `${from.toLowerCase()}-${to.toLowerCase()}`;
    return distances[key] || 1.0;
  }

  // Duration estimation methods
  estimateBusDuration(from, to) {
    const baseDuration = this.getDistanceMultiplier(from, to) * 8; // 8 hours base
    return `${Math.round(baseDuration)} hours`;
  }

  estimateTrainDuration(from, to, trainType) {
    const baseDuration = this.getDistanceMultiplier(from, to) * 6; // 6 hours base
    const typeMultiplier = trainType === 'express' ? 0.8 : 1;
    return `${Math.round(baseDuration * typeMultiplier)} hours`;
  }

  estimateFlightDuration(from, to) {
    const baseDuration = this.getDistanceMultiplier(from, to) * 1.5; // 1.5 hours base
    return `${Math.round(baseDuration * 60)} minutes`;
  }

  // Generate booking confirmation
  generateBookingConfirmation(validatedBooking, userId) {
    const bookingId = this.generateBookingId();
    const timestamp = new Date().toISOString();
    
    return {
      bookingId,
      userId,
      ...validatedBooking,
      status: this.bookingStatus.CONFIRMED,
      createdAt: timestamp,
      updatedAt: timestamp,
      confirmationCode: this.generateConfirmationCode(),
      paymentStatus: 'pending'
    };
  }

  generateBookingId() {
    const prefix = 'NX';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  generateConfirmationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

module.exports = BookingModel;

