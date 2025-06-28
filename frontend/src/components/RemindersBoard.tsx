
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Check, Trash2, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Reminder {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface RemindersBoardProps {
  language: string;
}

const RemindersBoard = ({ language }: RemindersBoardProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: language === 'en' ? 'Call Mom' : 'అమ్మకు కాల్ చేయండి',
      description: language === 'en' ? 'Daily check-in call' : 'రోజువారీ చెక్-ఇన్ కాల్',
      time: '18:00',
      date: '2024-01-20',
      completed: false,
      priority: 'high'
    },
    {
      id: '2',
      title: language === 'en' ? 'Doctor Appointment' : 'డాక్టర్ అపాయింట్మెంట్',
      description: language === 'en' ? 'Annual health checkup' : 'వార్షిక ఆరోగ్య పరీక్ష',
      time: '10:30',
      date: '2024-01-22',
      completed: false,
      priority: 'medium'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    time: '',
    date: '',
    priority: 'medium' as const
  });

  const addReminder = () => {
    if (!newReminder.title.trim()) return;

    const reminder: Reminder = {
      id: Date.now().toString(),
      ...newReminder,
      completed: false
    };

    setReminders(prev => [...prev, reminder]);
    setNewReminder({ title: '', description: '', time: '', date: '', priority: 'medium' });
    setShowAddForm(false);
  };

  const toggleComplete = (id: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
      )
    );
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
              {language === 'en' ? 'Smart Reminders' : 'స్మార్ట్ రిమైండర్లు'}
            </h2>
            <p className="text-gray-400">
              {language === 'en' ? 'Let NeuraX remember everything for you' : 'NeuraX మీ కోసం అన్నీ గుర్తుంచుకోనివ్వండి'}
            </p>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              {language === 'en' ? 'Add' : 'జోడించండి'}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Add Reminder Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-gray-800/30 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">
                  {language === 'en' ? 'New Reminder' : 'కొత్త రిమైండర్'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">
                    {language === 'en' ? 'Title' : 'శీర్షిక'}
                  </Label>
                  <Input
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={language === 'en' ? 'What should I remind you about?' : 'నేను మీకు దేని గురించి గుర్తు చేయాలి?'}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">
                    {language === 'en' ? 'Description' : 'వివరణ'}
                  </Label>
                  <Input
                    value={newReminder.description}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={language === 'en' ? 'Additional details...' : 'అదనపు వివరాలు...'}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">
                      {language === 'en' ? 'Date' : 'తేదీ'}
                    </Label>
                    <Input
                      type="date"
                      value={newReminder.date}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">
                      {language === 'en' ? 'Time' : 'సమయం'}
                    </Label>
                    <Input
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={addReminder}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Create Reminder' : 'రিమైండర్ క్రియేట్ చేయండి'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="border-gray-600 text-gray-400 hover:text-white"
                  >
                    {language === 'en' ? 'Cancel' : 'రద్దు చేయండి'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {reminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-l-4 ${getPriorityColor(reminder.priority)} bg-gray-800/30 border-r border-t border-b border-gray-700/50 ${reminder.completed ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <motion.button
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          reminder.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-400 hover:border-green-400'
                        }`}
                        onClick={() => toggleComplete(reminder.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {reminder.completed && <Check className="w-3 h-3" />}
                      </motion.button>

                      <div className="flex-1">
                        <h3 className={`font-semibold ${reminder.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                          {reminder.title}
                        </h3>
                        {reminder.description && (
                          <p className="text-sm text-gray-400 mt-1">{reminder.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{reminder.time}</span>
                          </div>
                          <span>{new Date(reminder.date).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            reminder.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            reminder.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {reminder.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      onClick={() => deleteReminder(reminder.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {reminders.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {language === 'en' ? 'No reminders yet. Add your first one!' : 'ఇంకా రిమైండర్లు లేవు. మీ మొదటిదాన్ని జోడించండి!'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default RemindersBoard;
