
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Shield, AlertTriangle, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  status: 'safe' | 'alert' | 'moving';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  lastSeen: Date;
}

const FamilyCircleMap = () => {
  const [familyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Mom',
      avatar: '👩‍💼',
      status: 'safe',
      location: {
        lat: 17.3850,
        lng: 78.4867,
        address: 'Hyderabad, Telangana'
      },
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'Dad',
      avatar: '👨‍💼',
      status: 'moving',
      location: {
        lat: 17.3750,
        lng: 78.4850,
        address: 'Gachibowli, Hyderabad'
      },
      lastSeen: new Date()
    },
    {
      id: '3',
      name: 'Sister',
      avatar: '👩‍🎓',
      status: 'safe',
      location: {
        lat: 17.4000,
        lng: 78.4900,
        address: 'HITEC City, Hyderabad'
      },
      lastSeen: new Date()
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400 border-green-400';
      case 'alert': return 'text-red-400 border-red-400';
      case 'moving': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Shield className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'moving': return <MapPin className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
          Family Circle
        </h2>
        <p className="text-gray-400">Track your family's safety and location in real-time</p>
      </motion.div>

      {/* Map Placeholder */}
      <motion.div
        className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-cyan-500/20 p-6 mb-6 h-64 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Interactive map would be displayed here</p>
          <p className="text-sm text-gray-500">Showing family member locations in Hyderabad</p>
        </div>
      </motion.div>

      {/* Family Members List */}
      <div className="grid gap-4">
        {familyMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className="text-3xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {member.avatar}
                    </motion.div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-400">{member.location.address}</p>
                      <div className={`flex items-center space-x-1 text-sm ${getStatusColor(member.status)}`}>
                        {getStatusIcon(member.status)}
                        <span className="capitalize">{member.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    
                    <motion.div
                      className={`w-3 h-3 rounded-full ${member.status === 'safe' ? 'bg-green-400' : member.status === 'alert' ? 'bg-red-400' : 'bg-yellow-400'}`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FamilyCircleMap;
