
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Mic, 
  Ticket, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  Clock, 
  Settings,
  X
} from 'lucide-react';

interface SidebarMenuProps {
  isOpen: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onClose: () => void;
}

const menuItems = [
  { id: 'chat', icon: MessageCircle, label: 'Chat', color: 'cyan' },
  { id: 'voice', icon: Mic, label: 'Voice', color: 'green' },
  { id: 'tickets', icon: Ticket, label: 'Tickets', color: 'blue' },
  { id: 'orders', icon: ShoppingBag, label: 'Orders', color: 'purple' },
  { id: 'family', icon: Users, label: 'Family Circle', color: 'pink' },
  { id: 'sos', icon: AlertTriangle, label: 'SOS', color: 'red' },
  { id: 'reminders', icon: Clock, label: 'Reminders', color: 'yellow' },
  { id: 'settings', icon: Settings, label: 'Settings', color: 'gray' },
];

const SidebarMenu = ({ isOpen, activeSection, setActiveSection, onClose }: SidebarMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.aside
            className="fixed left-0 top-0 h-full w-80 bg-black/40 backdrop-blur-lg border-r border-cyan-500/20 z-50 lg:relative lg:w-64"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <motion.h2
                  className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Neural Hub
                </motion.h2>
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item, index) => {
                  const isActive = activeSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? `bg-${item.color}-500/20 border border-${item.color}-500/30 text-${item.color}-400`
                          : 'hover:bg-white/10 text-gray-300 hover:text-white'
                      }`}
                      onClick={() => {
                        setActiveSection(item.id);
                        onClose();
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      
                      {isActive && (
                        <motion.div
                          className={`ml-auto w-2 h-2 bg-${item.color}-400 rounded-full`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SidebarMenu;
