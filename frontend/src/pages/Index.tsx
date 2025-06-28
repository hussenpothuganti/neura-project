
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartupSplash from '../components/StartupSplash';
import NeuraXHeader from '../components/NeuraXHeader';
import SidebarMenu from '../components/SidebarMenu';
import ChatWindow from '../components/ChatWindow';
import FamilyCircleMap from '../components/FamilyCircleMap';
import EmergencyAlertPanel from '../components/EmergencyAlertPanel';
import TicketBookingForm from '../components/TicketBookingForm';
import OrderAssistant from '../components/OrderAssistant';
import RemindersBoard from '../components/RemindersBoard';
import SettingsPanel from '../components/SettingsPanel';
import WakeWordEngine from '../components/WakeWordEngine';
import apiService from '../services/api';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('chat');
  const [language, setLanguage] = useState('en');
  const [isEmergency, setIsEmergency] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId] = useState(() => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initialize API service and socket connection
    const initializeConnection = async () => {
      try {
        // Check backend health
        await apiService.healthCheck();
        console.log('✅ Backend health check passed');

        // Initialize socket connection
        const socket = apiService.initializeSocket(userId);
        
        socket.on('connect', () => {
          setIsConnected(true);
          console.log('✅ Socket connected successfully');
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          console.log('❌ Socket disconnected');
        });

        socket.on('connection-confirmed', (data) => {
          console.log('✅ User connection confirmed:', data);
        });

      } catch (error) {
        console.error('❌ Failed to connect to backend:', error);
        setIsConnected(false);
      }
    };

    if (!isLoading) {
      initializeConnection();
    }

    // Cleanup on unmount
    return () => {
      apiService.disconnectSocket();
    };
  }, [isLoading, userId]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'chat':
        return <ChatWindow language={language} userId={userId} isConnected={isConnected} />;
      case 'family':
        return <FamilyCircleMap />;
      case 'tickets':
        return <TicketBookingForm language={language} userId={userId} isConnected={isConnected} />;
      case 'orders':
        return <OrderAssistant language={language} userId={userId} isConnected={isConnected} />;
      case 'reminders':
        return <RemindersBoard language={language} userId={userId} />;
      case 'settings':
        return <SettingsPanel language={language} setLanguage={setLanguage} userId={userId} />;
      default:
        return <ChatWindow language={language} userId={userId} isConnected={isConnected} />;
    }
  };

  if (isLoading) {
    return <StartupSplash />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      <WakeWordEngine onEmergency={() => setIsEmergency(true)} />
      
      <AnimatePresence>
        {isEmergency && (
          <EmergencyAlertPanel onClose={() => setIsEmergency(false)} />
        )}
      </AnimatePresence>

      <div className="flex h-screen">
        <SidebarMenu 
          isOpen={sidebarOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col">
          <NeuraXHeader 
            language={language}
            setLanguage={setLanguage}
            onMenuClick={() => setSidebarOpen(true)}
          />
          
          <motion.main 
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderActiveSection()}
          </motion.main>
        </div>
      </div>
    </div>
  );
};

export default Index;
