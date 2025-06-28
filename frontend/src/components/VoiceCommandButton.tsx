
import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceCommandButtonProps {
  isListening: boolean;
  onToggle: () => void;
  isSupported: boolean;
  className?: string;
}

const VoiceCommandButton = ({ isListening, onToggle, isSupported, className }: VoiceCommandButtonProps) => {
  if (!isSupported) {
    return null;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      <Button
        onClick={onToggle}
        variant="outline"
        size="icon"
        className={`${
          isListening 
            ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30' 
            : 'bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
        } transition-colors`}
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <MicOff className="w-4 h-4" />
          </motion.div>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </motion.div>
  );
};

export default VoiceCommandButton;
