
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Menu, Mic, MicOff, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NeuraXHeaderProps {
  language: string;
  setLanguage: (lang: string) => void;
  onMenuClick: () => void;
}

const NeuraXHeader = ({ language, setLanguage, onMenuClick }: NeuraXHeaderProps) => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isListening, setIsListening] = React.useState(false);

  return (
    <motion.header
      className="bg-black/30 backdrop-blur-lg border-b border-cyan-500/20 p-4"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-cyan-400 hover:bg-cyan-400/20"
          >
            <Menu className="w-6 h-6" />
          </Button>

          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center font-bold text-lg"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(34, 211, 238, 0.5)',
                  '0 0 40px rgba(34, 211, 238, 0.8)',
                  '0 0 20px rgba(34, 211, 238, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              N
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                NeuraX
              </h1>
              <p className="text-xs text-gray-400">Your AI Companion</p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
            onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {language === 'en' ? 'EN' : 'తె'}
          </motion.button>

          <motion.div
            className="flex items-center space-x-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <span className="text-xs text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </motion.div>

          <motion.button
            className={`p-2 rounded-full ${isListening ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'} border ${isListening ? 'border-red-500/30' : 'border-cyan-500/30'} hover:scale-110 transition-all`}
            onClick={() => setIsListening(!isListening)}
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          <motion.button
            className="p-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:scale-110 transition-all relative"
            whileHover={{ scale: 1.1 }}
          >
            <Bell className="w-5 h-5" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default NeuraXHeader;
