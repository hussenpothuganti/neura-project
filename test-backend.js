const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class BackendTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Neura-X Backend Tests...\n');

    await this.testHealthEndpoint();
    await this.testChatEndpoint();
    await this.testBookingEndpoints();
    await this.testVoiceEndpoints();
    
    this.printResults();
  }

  async testHealthEndpoint() {
    try {
      console.log('Testing health endpoint...');
      const response = await axios.get(`${BASE_URL}/health`);
      
      if (response.status === 200 && response.data.status === 'OK') {
        this.addResult('Health Check', 'PASS', 'Server is running');
      } else {
        this.addResult('Health Check', 'FAIL', 'Unexpected response');
      }
    } catch (error) {
      this.addResult('Health Check', 'FAIL', error.message);
    }
  }

  async testChatEndpoint() {
    try {
      console.log('Testing chat endpoint...');
      
      const chatData = {
        message: 'Hello, can you help me?',
        userId: 'test-user-123'
      };

      const response = await axios.post(`${BASE_URL}/api/chat`, chatData);
      
      if (response.status === 200 && response.data.success) {
        this.addResult('Chat API', 'PASS', 'Chat endpoint working');
      } else {
        this.addResult('Chat API', 'FAIL', 'Chat endpoint failed');
      }
    } catch (error) {
      this.addResult('Chat API', 'FAIL', error.message);
    }
  }

  async testBookingEndpoints() {
    try {
      console.log('Testing booking endpoints...');
      
      // Test booking simulation
      const simulationData = {
        bookingData: {
          type: 'bus',
          from: 'Delhi',
          to: 'Mumbai',
          date: '2025-07-01',
          time: '10:00',
          passengers: [{ name: 'Test User', age: 30 }]
        }
      };

      const simResponse = await axios.post(`${BASE_URL}/api/book/simulate`, simulationData);
      
      if (simResponse.status === 200 && simResponse.data.success) {
        this.addResult('Booking Simulation', 'PASS', 'Simulation working');
      } else {
        this.addResult('Booking Simulation', 'FAIL', 'Simulation failed');
      }

      // Test actual booking
      const bookingData = {
        userId: 'test-user-123',
        bookingData: {
          type: 'bus',
          from: 'Delhi',
          to: 'Mumbai',
          date: '2025-07-01',
          time: '10:00',
          passengers: [{ name: 'Test User', age: 30 }]
        }
      };

      const bookResponse = await axios.post(`${BASE_URL}/api/book`, bookingData);
      
      if (bookResponse.status === 201 && bookResponse.data.success) {
        this.addResult('Booking Creation', 'PASS', 'Booking created successfully');
        
        // Test getting user bookings
        const userBookingsResponse = await axios.get(`${BASE_URL}/api/book/user/test-user-123`);
        
        if (userBookingsResponse.status === 200 && userBookingsResponse.data.success) {
          this.addResult('Get User Bookings', 'PASS', 'Retrieved user bookings');
        } else {
          this.addResult('Get User Bookings', 'FAIL', 'Failed to get user bookings');
        }
      } else {
        this.addResult('Booking Creation', 'FAIL', 'Booking creation failed');
      }

    } catch (error) {
      this.addResult('Booking Tests', 'FAIL', error.message);
    }
  }

  async testVoiceEndpoints() {
    try {
      console.log('Testing voice endpoints...');
      
      const voiceData = {
        transcript: 'Book a ticket from Delhi to Mumbai',
        userId: 'test-user-123',
        confidence: 0.95
      };

      const response = await axios.post(`${BASE_URL}/api/voice/process`, voiceData);
      
      if (response.status === 200 && response.data.success) {
        this.addResult('Voice Processing', 'PASS', 'Voice processing working');
      } else {
        this.addResult('Voice Processing', 'FAIL', 'Voice processing failed');
      }

      // Test wake word endpoint
      const wakeWordData = {
        userId: 'test-user-123',
        wakeWord: 'neura',
        confidence: 0.9
      };

      const wakeResponse = await axios.post(`${BASE_URL}/api/voice/wake-word`, wakeWordData);
      
      if (wakeResponse.status === 200 && wakeResponse.data.success) {
        this.addResult('Wake Word', 'PASS', 'Wake word processing working');
      } else {
        this.addResult('Wake Word', 'FAIL', 'Wake word processing failed');
      }

    } catch (error) {
      this.addResult('Voice Tests', 'FAIL', error.message);
    }
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    const emoji = status === 'PASS' ? '✅' : '❌';
    console.log(`${emoji} ${test}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
    }
    
    console.log('\n🎯 Backend testing completed!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new BackendTester();
  tester.runAllTests().catch(console.error);
}

module.exports = BackendTester;

