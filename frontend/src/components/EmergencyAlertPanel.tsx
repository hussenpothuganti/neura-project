
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, MapPin, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmergencyAlertPanelProps {
  onClose: () => void;
}

const EmergencyAlertPanel = ({ onClose }: EmergencyAlertPanelProps) => {
  return (
    <motion.div
      className="fixed inset-0 bg-red-900/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 border-2 border-red-500 rounded-xl p-6 w-full max-w-md"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 10 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-red-400">EMERGENCY ALERT</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <span className="text-white font-semibold">Current Location</span>
              </div>
              <p className="text-gray-300 text-sm">
                Lat: 17.3850, Lng: 78.4867
              </p>
              <p className="text-gray-300 text-sm">
                Hyderabad, Telangana, India
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3">
            <motion.button
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg flex items-center justify-center space-x-3 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Phone className="w-5 h-5" />
              <span className="font-semibold">Call Parents</span>
            </motion.button>

            <motion.button
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center justify-center space-x-3 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Alert Police</span>
            </motion.button>

            <motion.button
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center justify-center space-x-3 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-5 h-5" />
              <span className="font-semibold">Broadcast to Family</span>
            </motion.button>
          </div>

          <div className="text-center">
            <motion.p
              className="text-gray-400 text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Emergency services have been notified
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmergencyAlertPanel;
