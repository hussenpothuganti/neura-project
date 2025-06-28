
import React from 'react';
import { motion } from 'framer-motion';

interface VoiceWaveProps {
  isActive: boolean;
}

const VoiceWave = ({ isActive }: VoiceWaveProps) => {
  return (
    <motion.div
      className="flex items-center space-x-1"
      animate={isActive ? { opacity: 1 } : { opacity: 0.3 }}
    >
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-cyan-400 rounded-full"
          style={{ height: `${8 + i * 2}px` }}
          animate={isActive ? {
            scaleY: [1, 1.5, 0.5, 1.2, 1],
          } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </motion.div>
  );
};

export default VoiceWave;
