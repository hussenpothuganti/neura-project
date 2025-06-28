import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Train, Bus, Film, Calendar, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import VoiceCommandButton from './VoiceCommandButton';
import { useToast } from '@/components/ui/use-toast';

interface TicketBookingFormProps {
  language: string;
}

const TicketBookingForm = ({ language }: TicketBookingFormProps) => {
  const { toast } = useToast();
  const [ticketType, setTicketType] = useState<'train' | 'bus' | 'movie'>('train');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: '1',
    movie: '',
    theater: '',
    showtime: ''
  });

  const voiceCommands = [
    'book train', 'book bus', 'book movie',
    'train booking', 'bus booking', 'movie booking',
    'from', 'to', 'destination', 'passengers', 'date'
  ];

  const handleVoiceCommand = (command: string, transcript: string) => {
    console.log('Voice command received:', command, transcript);
    
    if (transcript.includes('train')) {
      setTicketType('train');
      toast({
        title: language === 'en' ? 'Voice Command' : 'వాయిస్ కమాండ్',
        description: language === 'en' ? 'Switched to train booking' : 'రైలు బుకింగ్‌కు మార్చబడింది'
      });
    } else if (transcript.includes('bus')) {
      setTicketType('bus');
      toast({
        title: language === 'en' ? 'Voice Command' : 'వాయిస్ కమాండ్',
        description: language === 'en' ? 'Switched to bus booking' : 'బస్ బుకింగ్‌కు మార్చబడింది'
      });
    } else if (transcript.includes('movie')) {
      setTicketType('movie');
      toast({
        title: language === 'en' ? 'Voice Command' : 'వాయిస్ కమాండ్',
        description: language === 'en' ? 'Switched to movie booking' : 'సినిమా బుకింగ్‌కు మార్చబడింది'
      });
    }

    // Extract city names for from/to fields
    if (transcript.includes('from')) {
      const words = transcript.split(' ');
      const fromIndex = words.findIndex(word => word.includes('from'));
      if (fromIndex !== -1 && words[fromIndex + 1]) {
        setFormData(prev => ({ ...prev, from: words[fromIndex + 1] }));
      }
    }

    if (transcript.includes('to') || transcript.includes('destination')) {
      const words = transcript.split(' ');
      const toIndex = words.findIndex(word => word.includes('to') || word.includes('destination'));
      if (toIndex !== -1 && words[toIndex + 1]) {
        setFormData(prev => ({ ...prev, to: words[toIndex + 1] }));
      }
    }
  };

  const { isListening, startListening, stopListening, isSupported } = useVoiceCommands({
    onCommand: handleVoiceCommand,
    commands: voiceCommands,
    language: language === 'en' ? 'en-US' : 'te-IN'
  });

  const ticketTypes = [
    { id: 'train', icon: Train, label: language === 'en' ? 'Train' : 'రైలు', color: 'blue' },
    { id: 'bus', icon: Bus, label: language === 'en' ? 'Bus' : 'బస్సు', color: 'green' },
    { id: 'movie', icon: Film, label: language === 'en' ? 'Movie' : 'సినిమా', color: 'purple' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBooking = () => {
    console.log('Booking:', { type: ticketType, ...formData });
    toast({
      title: language === 'en' ? 'Booking Confirmed' : 'బుకింగ్ ధృవీకరించబడింది',
      description: language === 'en' ? 'Your ticket has been booked successfully!' : 'మీ టికెట్ విజయవంతంగా బుక్ చేయబడింది!'
    });
  };

  const getTicketTypeColor = (type: string, isActive: boolean) => {
    if (!isActive) return 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600';
    
    switch (type) {
      case 'blue':
        return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'green':
        return 'bg-green-500/20 border-green-500 text-green-400';
      case 'purple':
        return 'bg-purple-500/20 border-purple-500 text-purple-400';
      default:
        return 'bg-cyan-500/20 border-cyan-500 text-cyan-400';
    }
  };

  const getCurrentTicketType = () => {
    return ticketTypes.find(t => t.id === ticketType);
  };

  const getBookingTitle = () => {
    const currentType = getCurrentTicketType();
    if (language === 'en') {
      return `${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Booking`;
    } else {
      return `${currentType?.label} బుకింగ్`;
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            {language === 'en' ? 'Ticket Booking' : 'టికెట్ బుకింగ్'}
          </h2>
          <VoiceCommandButton
            isListening={isListening}
            onToggle={isListening ? stopListening : startListening}
            isSupported={isSupported}
          />
        </div>
        <p className="text-gray-400">
          {language === 'en' ? 'Book your travel tickets with AI assistance' : 'AI సహాయంతో మీ ప్రయాణ టికెట్లను బుక్ చేయండి'}
        </p>
        {isSupported && (
          <p className="text-sm text-cyan-400 mt-1">
            {language === 'en' 
              ? `Voice commands: Say "train", "bus", or "movie" to switch booking types`
              : `వాయిస్ కమాండ్లు: బుకింగ్ రకాలను మార్చడానికి "రైలు", "బస్సు", లేదా "సినిమా" అని చెప్పండి`
            }
          </p>
        )}
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {ticketTypes.map((type, index) => {
          const IconComponent = type.icon;
          return (
            <motion.button
              key={type.id}
              className={`p-4 rounded-lg border-2 transition-all ${getTicketTypeColor(type.color, ticketType === type.id)}`}
              onClick={() => setTicketType(type.id as any)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconComponent className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">{type.label}</p>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gray-800/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              {(() => {
                const currentType = getCurrentTicketType();
                if (currentType) {
                  const IconComponent = currentType.icon;
                  return <IconComponent className="w-6 h-6" />;
                }
                return null;
              })()}
              <span>{getBookingTitle()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticketType !== 'movie' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">
                      {language === 'en' ? 'From' : 'నుండి'}
                    </Label>
                    <Input
                      value={formData.from}
                      onChange={(e) => handleInputChange('from', e.target.value)}
                      placeholder={language === 'en' ? 'Departure city' : 'బయలుదేరే నగరం'}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">
                      {language === 'en' ? 'To' : 'వరకు'}
                    </Label>
                    <Input
                      value={formData.to}
                      onChange={(e) => handleInputChange('to', e.target.value)}
                      placeholder={language === 'en' ? 'Destination city' : 'గమ్యస్థాన నగరం'}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-gray-300">
                    {language === 'en' ? 'Movie' : 'సినిమా'}
                  </Label>
                  <Input
                    value={formData.movie}
                    onChange={(e) => handleInputChange('movie', e.target.value)}
                    placeholder={language === 'en' ? 'Movie name' : 'సినిమా పేరు'}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">
                    {language === 'en' ? 'Theater' : 'థియేటర్'}
                  </Label>
                  <Input
                    value={formData.theater}
                    onChange={(e) => handleInputChange('theater', e.target.value)}
                    placeholder={language === 'en' ? 'Theater name' : 'థియేటర్ పేరు'}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{language === 'en' ? 'Date' : 'తేదీ'}</span>
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{language === 'en' ? 'Passengers' : 'ప్రయాణికులు'}</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.passengers}
                  onChange={(e) => handleInputChange('passengers', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleBooking}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3"
              >
                {language === 'en' ? 'Book Now' : 'ఇప్పుడే బుక్ చేయండి'}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TicketBookingForm;
