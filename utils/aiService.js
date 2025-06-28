const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');

class AIService {
  constructor() {
    // Initialize DeepSeek client using OpenAI SDK
    this.deepseek = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY || 'dummy-key'
    });

    // Initialize OpenAI client as fallback
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
    });

    this.isDeepSeekAvailable = !!process.env.DEEPSEEK_API_KEY;
    this.isOpenAIAvailable = !!process.env.OPENAI_API_KEY;
  }

  async processMessage(message, context = [], useReasoner = false) {
    try {
      // Try DeepSeek first if available
      if (this.isDeepSeekAvailable) {
        return await this.callDeepSeek(message, context, useReasoner);
      }
      
      // Fallback to OpenAI if available
      if (this.isOpenAIAvailable) {
        return await this.callOpenAI(message, context);
      }
      
      // Final fallback to web scraping
      return await this.webSearch(message);
      
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Try fallback methods
      if (this.isOpenAIAvailable && error.message.includes('DeepSeek')) {
        try {
          return await this.callOpenAI(message, context);
        } catch (openaiError) {
          console.error('OpenAI fallback failed:', openaiError);
        }
      }
      
      // Final fallback to web search
      try {
        return await this.webSearch(message);
      } catch (searchError) {
        console.error('Web search fallback failed:', searchError);
        return {
          response: "I'm having trouble processing your request right now. Please try again later.",
          source: 'error',
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  async callDeepSeek(message, context = [], useReasoner = false) {
    const model = useReasoner ? 'deepseek-reasoner' : 'deepseek-chat';
    
    const messages = [
      {
        role: 'system',
        content: `You are Neura-X Guardian Angel, a helpful AI assistant. You provide accurate, helpful, and friendly responses. Current time: ${new Date().toISOString()}`
      },
      ...context.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    const completion = await this.deepseek.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    });

    return {
      response: completion.choices[0].message.content,
      source: 'deepseek',
      model: model,
      timestamp: new Date().toISOString(),
      usage: completion.usage
    };
  }

  async callOpenAI(message, context = []) {
    const messages = [
      {
        role: 'system',
        content: `You are Neura-X Guardian Angel, a helpful AI assistant. You provide accurate, helpful, and friendly responses. Current time: ${new Date().toISOString()}`
      },
      ...context.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    return {
      response: completion.choices[0].message.content,
      source: 'openai',
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString(),
      usage: completion.usage
    };
  }

  async webSearch(query) {
    try {
      // Use DuckDuckGo instant answer API as a simple fallback
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Neura-X Guardian Angel Bot 1.0'
        }
      });

      let result = '';
      
      if (response.data.AbstractText) {
        result = response.data.AbstractText;
      } else if (response.data.Answer) {
        result = response.data.Answer;
      } else if (response.data.Definition) {
        result = response.data.Definition;
      } else {
        // Fallback to a simple web scraping of search results
        result = await this.scrapeSearchResults(query);
      }

      return {
        response: result || "I couldn't find specific information about that. Could you please rephrase your question?",
        source: 'web_search',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Web search error:', error);
      throw error;
    }
  }

  async scrapeSearchResults(query) {
    try {
      // Simple Google search scraping (be mindful of rate limits)
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract search result snippets
      const snippets = [];
      $('.BNeawe.s3v9rd.AP7Wnd, .BNeawe.vvjwJb.AP7Wnd').each((i, elem) => {
        if (i < 3) { // Take first 3 snippets
          const text = $(elem).text().trim();
          if (text.length > 20) {
            snippets.push(text);
          }
        }
      });

      if (snippets.length > 0) {
        return `Based on web search: ${snippets.join(' ')}`;
      }

      return "I found some information but couldn't extract clear details. Please try a more specific question.";

    } catch (error) {
      console.error('Scraping error:', error);
      return "I'm having trouble accessing web information right now.";
    }
  }

  async streamResponse(message, context = [], callback) {
    try {
      if (!this.isDeepSeekAvailable && !this.isOpenAIAvailable) {
        // For web search, we can't really stream, so just call once
        const result = await this.webSearch(message);
        callback(result.response, true); // true indicates completion
        return;
      }

      const client = this.isDeepSeekAvailable ? this.deepseek : this.openai;
      const model = this.isDeepSeekAvailable ? 'deepseek-chat' : 'gpt-3.5-turbo';

      const messages = [
        {
          role: 'system',
          content: `You are Neura-X Guardian Angel, a helpful AI assistant. You provide accurate, helpful, and friendly responses. Current time: ${new Date().toISOString()}`
        },
        ...context.slice(-10),
        {
          role: 'user',
          content: message
        }
      ];

      const stream = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          callback(content, false); // false indicates partial response
        }
      }

      callback('', true); // Signal completion

    } catch (error) {
      console.error('Streaming error:', error);
      callback('Sorry, I encountered an error while processing your request.', true);
    }
  }

  // Helper method to determine if we should use the reasoner model
  shouldUseReasoner(message) {
    const reasoningKeywords = [
      'analyze', 'explain', 'reasoning', 'logic', 'problem', 'solve', 
      'calculate', 'math', 'complex', 'detailed', 'step by step'
    ];
    
    const lowerMessage = message.toLowerCase();
    return reasoningKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

module.exports = AIService;

