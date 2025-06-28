import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Types
export interface ChatMessage {
  message: string;
  userId: string;
  conversationId?: string;
  useReasoner?: boolean;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  source: string;
  model?: string;
  timestamp: string;
  usage?: any;
  conversationId: string;
}

export interface BookingData {
  type: 'bus' | 'train' | 'flight';
  from: string;
  to: string;
  date?: string;
  departureDate?: string;
  returnDate?: string;
  time?: string;
  passengers: Array<{
    name: string;
    age: number;
    type?: string;
    id?: string;
  }>;
  class?: string;
  seatType?: string;
}

export interface BookingRequest {
  userId: string;
  bookingData: BookingData;
}

export interface BookingResponse {
  success: boolean;
  booking?: any;
  message: string;
}

export interface VoiceRequest {
  transcript: string;
  userId: string;
  sessionId?: string;
  confidence?: number;
  language?: string;
}

export interface VoiceResponse {
  success: boolean;
  response: string;
  source: string;
  commandType: string;
  timestamp: string;
  shouldSpeak: boolean;
}

class ApiService {
  private api: AxiosInstance;
  private socket: Socket | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Socket.IO Methods
  initializeSocket(userId: string, sessionId: string = 'default'): Socket {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      
      // Authenticate user
      this.socket?.emit('user-connect', {
        userId,
        sessionId,
        preferences: {}
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connection-confirmed', (data) => {
      console.log('✅ User connection confirmed:', data);
    });

    this.socket.on('connection-error', (error) => {
      console.error('❌ Connection error:', error);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat API Methods
  async sendChatMessage(data: ChatMessage): Promise<ChatResponse> {
    try {
      const response = await this.api.post('/chat', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send chat message');
    }
  }

  async getChatHistory(userId: string, conversationId: string = 'default'): Promise<any> {
    try {
      const response = await this.api.get(`/chat/history/${userId}`, {
        params: { conversationId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get chat history');
    }
  }

  async clearChatHistory(userId: string, conversationId: string = 'default'): Promise<any> {
    try {
      const response = await this.api.delete(`/chat/history/${userId}`, {
        params: { conversationId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to clear chat history');
    }
  }

  async webSearch(query: string, userId: string): Promise<any> {
    try {
      const response = await this.api.post('/chat/web-search', { query, userId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to perform web search');
    }
  }

  // Booking API Methods
  async createBooking(data: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await this.api.post('/book', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create booking');
    }
  }

  async getBooking(bookingId: string): Promise<any> {
    try {
      const response = await this.api.get(`/book/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get booking');
    }
  }

  async getUserBookings(userId: string, options: any = {}): Promise<any> {
    try {
      const response = await this.api.get(`/book/user/${userId}`, { params: options });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get user bookings');
    }
  }

  async updateBooking(bookingId: string, updates: any, userId: string): Promise<any> {
    try {
      const response = await this.api.put(`/book/${bookingId}`, { updates, userId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update booking');
    }
  }

  async cancelBooking(bookingId: string, userId: string, reason: string = 'User cancellation'): Promise<any> {
    try {
      const response = await this.api.delete(`/book/${bookingId}`, {
        data: { userId, reason }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to cancel booking');
    }
  }

  async searchBookings(criteria: any, userId?: string): Promise<any> {
    try {
      const response = await this.api.post('/book/search', { criteria, userId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to search bookings');
    }
  }

  async getBookingStats(userId: string): Promise<any> {
    try {
      const response = await this.api.get(`/book/stats/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get booking stats');
    }
  }

  async simulateBooking(bookingData: BookingData): Promise<any> {
    try {
      const response = await this.api.post('/book/simulate', { bookingData });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to simulate booking');
    }
  }

  async saveUserPreferences(userId: string, preferences: any): Promise<any> {
    try {
      const response = await this.api.post(`/book/preferences/${userId}`, { preferences });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to save user preferences');
    }
  }

  async getUserPreferences(userId: string): Promise<any> {
    try {
      const response = await this.api.get(`/book/preferences/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get user preferences');
    }
  }

  // Voice API Methods
  async processVoice(data: VoiceRequest): Promise<VoiceResponse> {
    try {
      const response = await this.api.post('/voice/process', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to process voice');
    }
  }

  async processVoiceCommand(command: string, userId: string, parameters: any = {}): Promise<any> {
    try {
      const response = await this.api.post('/voice/command', { command, userId, parameters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to process voice command');
    }
  }

  async getVoiceSession(userId: string, sessionId: string = 'default'): Promise<any> {
    try {
      const response = await this.api.get(`/voice/session/${userId}`, {
        params: { sessionId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get voice session');
    }
  }

  async clearVoiceSession(userId: string, sessionId: string = 'default'): Promise<any> {
    try {
      const response = await this.api.delete(`/voice/session/${userId}`, {
        params: { sessionId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to clear voice session');
    }
  }

  async processWakeWord(userId: string, wakeWord: string, confidence: number): Promise<any> {
    try {
      const response = await this.api.post('/voice/wake-word', {
        userId,
        wakeWord,
        confidence,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to process wake word');
    }
  }

  async sendEmergencyAlert(userId: string, emergencyType: string, location?: string, additionalInfo?: string): Promise<any> {
    try {
      const response = await this.api.post('/voice/emergency', {
        userId,
        emergencyType,
        location,
        additionalInfo
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send emergency alert');
    }
  }

  // Health Check
  async healthCheck(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.data;
    } catch (error: any) {
      throw new Error('Backend health check failed');
    }
  }

  // Real-time Socket Events
  onChatResponse(callback: (data: any) => void): void {
    this.socket?.on('chat-response', callback);
  }

  onChatProcessing(callback: (data: any) => void): void {
    this.socket?.on('chat-processing', callback);
  }

  onChatError(callback: (data: any) => void): void {
    this.socket?.on('chat-error', callback);
  }

  onVoiceResponse(callback: (data: any) => void): void {
    this.socket?.on('voice-response', callback);
  }

  onVoiceError(callback: (data: any) => void): void {
    this.socket?.on('voice-error', callback);
  }

  onBookingConfirmed(callback: (data: any) => void): void {
    this.socket?.on('booking-confirmed', callback);
  }

  onBookingError(callback: (data: any) => void): void {
    this.socket?.on('booking-error', callback);
  }

  onEmergencyResponse(callback: (data: any) => void): void {
    this.socket?.on('emergency-response', callback);
  }

  onWakeWordResponse(callback: (data: any) => void): void {
    this.socket?.on('wake-word-response', callback);
  }

  // Send real-time events
  sendChatMessageRealtime(message: string, userId: string, conversationId: string = 'default'): void {
    this.socket?.emit('chat-message', {
      message,
      userId,
      conversationId
    });
  }

  sendVoiceCommandRealtime(transcript: string, userId: string, confidence: number, sessionId: string = 'default'): void {
    this.socket?.emit('voice-command', {
      transcript,
      userId,
      confidence,
      sessionId
    });
  }

  sendBookingRequestRealtime(userId: string, bookingData: BookingData): void {
    this.socket?.emit('booking-request', {
      userId,
      bookingData
    });
  }

  sendEmergencyAlertRealtime(userId: string, emergencyType: string, location?: string, additionalInfo?: string): void {
    this.socket?.emit('emergency-alert', {
      userId,
      emergencyType,
      location,
      additionalInfo
    });
  }

  sendWakeWordDetection(userId: string, wakeWord: string, confidence: number): void {
    this.socket?.emit('wake-word-detected', {
      userId,
      wakeWord,
      confidence
    });
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

