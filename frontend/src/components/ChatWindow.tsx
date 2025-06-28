
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VoiceWave from './VoiceWave';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'neurax';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatWindowProps {
  language: string;
}

const ChatWindow = ({ language }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: language === 'en' ? 'Hello! I\'m NeuraX, your AI companion. How can I help you today?' : 'నమస్కారం! నేను NeuraX, మీ AI సహాయకుడు. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
      sender: 'neurax',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate NeuraX thinking and responding
    setTimeout(() => {
      const responses = {
        en: [
          "I understand. Let me help you with that.",
          "That's interesting! Tell me more about it.",
          "I'm here to assist you. What would you like to know?",
          "Great question! Here's what I think...",
          "I'm always learning. Thanks for sharing that with me."
        ],
        te: [
          "నేను అర్థం చేసుకున్నాను. దానితో నేను మీకు సహాయం చేస్తాను.",
          "అది ఆసక్తికరం! దాని గురించి మరింత చెప్పండి.",
          "నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
          "మంచి ప్రశ్న! నేను ఏమనుకుంటున్నానో ఇది...",
          "నేను ఎల్లప్పుడూ నేర్చుకుంటూనే ఉంటాను. దాన్ని నాతో పంచుకున్నందుకు ధన్యవాదాలు."
        ]
      };

      const responseText = responses[language as keyof typeof responses][
        Math.floor(Math.random() * responses[language as keyof typeof responses].length)
      ];

      const neuraXMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'neurax',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, neuraXMessage]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900/50 to-black/50 backdrop-blur-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <motion.div
                  className={`p-4 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  {message.sender === 'neurax' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                        N
                      </div>
                      <VoiceWave isActive={false} />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-4 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                  N
                </div>
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        className="p-6 bg-black/30 backdrop-blur-lg border-t border-cyan-500/20"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={language === 'en' ? 'Type your message...' : 'మీ సందేశాన్ని టైప్ చేయండి...'}
              className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 pr-20 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            />
            <motion.div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-cyan-400 hover:bg-cyan-400/20"
              >
                <Mic className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            disabled={!inputText.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatWindow;
