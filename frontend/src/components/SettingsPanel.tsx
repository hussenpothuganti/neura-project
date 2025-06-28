
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Globe, 
  Palette, 
  Heart, 
  Bell, 
  BellOff, 
  Wifi,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SettingsPanelProps {
  language: string;
  setLanguage: (lang: string) => void;
}

const SettingsPanel = ({ language, setLanguage }: SettingsPanelProps) => {
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    notifications: true,
    backgroundService: true,
    theme: 'dark',
    aiMood: 'friendly'
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const settingsConfig = [
    {
      title: language === 'en' ? 'Voice Control' : 'వాయిస్ కంట్రోల్',
      description: language === 'en' ? 'Enable voice commands and responses' : 'వాయిస్ కమాండ్లు మరియు ప్రతిస్పందనలను ప్రారంభించండి',
      icon: settings.voiceEnabled ? Volume2 : VolumeX,
      value: settings.voiceEnabled,
      action: () => toggleSetting('voiceEnabled'),
      color: 'cyan'
    },
    {
      title: language === 'en' ? 'Notifications' : 'నోటిఫికేషన్లు',
      description: language === 'en' ? 'Receive alerts and reminders' : 'అలర్ట్లు మరియు రిమైండర్లను స్వీకరించండి',
      icon: settings.notifications ? Bell : BellOff,
      value: settings.notifications,
      action: () => toggleSetting('notifications'),
      color: 'yellow'
    },
    {
      title: language === 'en' ? 'Background Service' : 'బ్యాక్‌గ్రౌండ్ సేవ',
      description: language === 'en' ? 'Keep NeuraX active even when screen is off' : 'స్క్రీన్ ఆఫ్ అయినప్పుడు కూడా NeuraX ను సక్రియంగా ఉంచండి',
      icon: Wifi,
      value: settings.backgroundService,
      action: () => toggleSetting('backgroundService'),
      color: 'green'
    }
  ];

  const themes = [
    { id: 'dark', name: language === 'en' ? 'Dark' : 'డార్క్', icon: Moon },
    { id: 'light', name: language === 'en' ? 'Light' : 'లైట్', icon: Sun },
    { id: 'neon', name: language === 'en' ? 'Neon' : 'నియాన్', icon: Zap }
  ];

  const aiMoods = [
    { id: 'professional', name: language === 'en' ? 'Professional' : 'వృత్తిపరమైన', emoji: '💼' },
    { id: 'friendly', name: language === 'en' ? 'Friendly' : 'స్నేహపూర్వక', emoji: '😊' },
    { id: 'emotional', name: language === 'en' ? 'Emotional' : 'భావోద్వేగ', emoji: '❤️' }
  ];

  return (
    <div className="p-6 h-full overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
          {language === 'en' ? 'Settings' : 'సెట్టింగ్‌లు'}
        </h2>
        <p className="text-gray-400">
          {language === 'en' ? 'Customize your NeuraX experience' : 'మీ NeuraX అనుభవాన్ని అనుకూలీకరించండి'}
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Toggle Settings */}
        <div className="space-y-4">
          {settingsConfig.map((setting, index) => (
            <motion.div
              key={setting.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-${setting.color}-500/20 text-${setting.color}-400`}>
                        <setting.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{setting.title}</h3>
                        <p className="text-sm text-gray-400">{setting.description}</p>
                      </div>
                    </div>
                    
                    <motion.button
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        setting.value ? `bg-${setting.color}-500` : 'bg-gray-600'
                      }`}
                      onClick={setting.action}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                        animate={{ x: setting.value ? 32 : 4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Globe className="w-6 h-6 text-blue-400" />
                <span>{language === 'en' ? 'Language' : 'భాష'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  className={`p-3 rounded-lg border transition-all ${
                    language === 'en'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                  onClick={() => setLanguage('en')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-semibold">English</span>
                </motion.button>
                <motion.button
                  className={`p-3 rounded-lg border transition-all ${
                    language === 'te'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                  onClick={() => setLanguage('te')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-semibold">తెలుగు</span>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Palette className="w-6 h-6 text-purple-400" />
                <span>{language === 'en' ? 'Theme' : 'థీమ్'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {themes.map((theme) => (
                  <motion.button
                    key={theme.id}
                    className={`p-3 rounded-lg border transition-all ${
                      settings.theme === theme.id
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                    onClick={() => setSetting('theme', theme.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <theme.icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-semibold">{theme.name}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Mood Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gray-800/30 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Heart className="w-6 h-6 text-pink-400" />
                <span>{language === 'en' ? 'AI Personality' : 'AI వ్యక్తిత్వం'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {aiMoods.map((mood) => (
                  <motion.button
                    key={mood.id}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      settings.aiMood === mood.id
                        ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                        : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                    onClick={() => setSetting('aiMood', mood.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="font-semibold">{mood.name}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPanel;
