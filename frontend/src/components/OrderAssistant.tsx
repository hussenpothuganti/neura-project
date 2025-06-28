
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Star, Heart, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import VoiceCommandButton from './VoiceCommandButton';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  platform: 'flipkart' | 'amazon';
  discount?: number;
}

interface OrderAssistantProps {
  language: string;
}

const OrderAssistant = ({ language }: OrderAssistantProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'iPhone 15 Pro Max 256GB',
      price: 134900,
      originalPrice: 159900,
      rating: 4.5,
      reviews: 1250,
      image: '📱',
      platform: 'flipkart',
      discount: 16
    },
    {
      id: '2',
      name: 'Samsung Galaxy S24 Ultra',
      price: 124999,
      originalPrice: 139999,
      rating: 4.6,
      reviews: 890,
      image: '📱',
      platform: 'amazon',
      discount: 11
    },
    {
      id: '3',
      name: 'MacBook Air M2 13"',
      price: 99900,
      originalPrice: 119900,
      rating: 4.7,
      reviews: 2100,
      image: '💻',
      platform: 'flipkart',
      discount: 17
    },
    {
      id: '4',
      name: 'Sony WH-1000XM5 Headphones',
      price: 24990,
      originalPrice: 29990,
      rating: 4.8,
      reviews: 560,
      image: '🎧',
      platform: 'amazon',
      discount: 17
    }
  ]);

  const [filteredProducts, setFilteredProducts] = useState(products);

  const voiceCommands = [
    'search', 'find', 'order', 'buy', 'add to cart',
    'iphone', 'samsung', 'macbook', 'headphones',
    'phone', 'laptop', 'computer'
  ];

  const handleVoiceCommand = (command: string, transcript: string) => {
    console.log('Voice command received:', command, transcript);
    
    // Extract search terms from voice commands
    if (transcript.includes('search') || transcript.includes('find')) {
      const searchTerms = transcript.replace(/search|find|for/g, '').trim();
      if (searchTerms) {
        setSearchQuery(searchTerms);
        handleSearch(searchTerms);
        toast({
          title: language === 'en' ? 'Voice Search' : 'వాయిస్ వెతకండి',
          description: language === 'en' ? `Searching for: ${searchTerms}` : `వెతుకుతోంది: ${searchTerms}`
        });
      }
    }

    // Direct product searches
    if (transcript.includes('iphone') || transcript.includes('phone')) {
      setSearchQuery('iPhone');
      handleSearch('iPhone');
    } else if (transcript.includes('samsung')) {
      setSearchQuery('Samsung');
      handleSearch('Samsung');
    } else if (transcript.includes('macbook') || transcript.includes('laptop')) {
      setSearchQuery('MacBook');
      handleSearch('MacBook');
    } else if (transcript.includes('headphones')) {
      setSearchQuery('headphones');
      handleSearch('headphones');
    }
  };

  const { isListening, startListening, stopListening, isSupported } = useVoiceCommands({
    onCommand: handleVoiceCommand,
    commands: voiceCommands,
    language: language === 'en' ? 'en-US' : 'te-IN'
  });

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleOrder = (product: Product) => {
    toast({
      title: language === 'en' ? 'Order Placed' : 'ఆర్డర్ ఇవ్వబడింది',
      description: language === 'en' ? `Ordered: ${product.name}` : `ఆర్డర్ చేయబడింది: ${product.name}`
    });
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
            {language === 'en' ? 'AI Shopping Assistant' : 'AI షాపింగ్ అసిస్టెంట్'}
          </h2>
          <VoiceCommandButton
            isListening={isListening}
            onToggle={isListening ? stopListening : startListening}
            isSupported={isSupported}
          />
        </div>
        <p className="text-gray-400">
          {language === 'en' ? 'Find and order products from Flipkart & Amazon' : 'Flipkart & Amazon నుండి ఉత్పాదనలను కనుగొని ఆర్డర్ చేయండి'}
        </p>
        {isSupported && (
          <p className="text-sm text-cyan-400 mt-1">
            {language === 'en' 
              ? `Voice commands: Say "search iPhone", "find laptop", or "order headphones"`
              : `వాయిస్ కమాండ్లు: "iPhone వెతకండి", "లాప్‌టాప్ కనుగొనండి", లేదా "హెడ్‌ఫోన్లు ఆర్డర్ చేయండి" అని చెప్పండి`
            }
          </p>
        )}
      </motion.div>

      {/* Search Bar */}
      <motion.div
        className="flex space-x-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex-1 relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={language === 'en' ? 'Search for products...' : 'ఉత్పాదనల కోసం వెతకండి...'}
            className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 pr-12"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <Button
          onClick={() => handleSearch()}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          {language === 'en' ? 'Search' : 'వెతకండి'}
        </Button>
      </motion.div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 transition-all overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 h-48 flex items-center justify-center text-6xl">
                    {product.image}
                  </div>
                  
                  {product.discount && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                      {product.discount}% OFF
                    </div>
                  )}
                  
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold text-white ${
                    product.platform === 'flipkart' ? 'bg-orange-500' : 'bg-yellow-600'
                  }`}>
                    {product.platform.toUpperCase()}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">{product.name}</h3>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-300">{product.rating}</span>
                    </div>
                    <span className="text-sm text-gray-400">({product.reviews} reviews)</span>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xl font-bold text-green-400">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <motion.div
                      className="flex-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        onClick={() => handleOrder(product)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {language === 'en' ? 'Order Now' : 'ఇప్పుడే ఆర్డర్ చేయండి'}
                      </Button>
                    </motion.div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-gray-400 text-lg">
            {language === 'en' ? 'No products found. Try a different search term.' : 'ఏ ఉత్పాదనలు కనుగొనబడలేదు. వేరే పదాన్ని ప్రయత్నించండి.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default OrderAssistant;
