
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WakeWordEngineProps {
  onEmergency: () => void;
}

const WakeWordEngine = ({ onEmergency }: WakeWordEngineProps) => {
  const [isListening, setIsListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  useEffect(() => {
    // Simulate wake word detection
    const interval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every second
        setWakeWordDetected(true);
        setIsListening(true);
        
        setTimeout(() => {
          setWakeWordDetected(false);
          setIsListening(false);
        }, 3000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {wakeWordDetected && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <motion.div
            className="bg-gradient-to-r from-cyan-500 to-purple-500 p-4 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 20px rgba(34, 211, 238, 0.5)',
                '0 0 40px rgba(34, 211, 238, 0.8)',
                '0 0 20px rgba(34, 211, 238, 0.5)'
              ]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="w-6 h-6 text-white font-bold flex items-center justify-center">
              N
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WakeWordEngine;
