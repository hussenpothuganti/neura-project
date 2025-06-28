# DeepSeek API Integration Research

## Key Findings

### API Configuration
- Base URL: `https://api.deepseek.com`
- Compatible with OpenAI SDK format
- Requires API key authentication
- Two main models:
  - `deepseek-chat` (points to DeepSeek-V3-0324)
  - `deepseek-reasoner` (points to DeepSeek-R1-0528)

### Node.js Integration Example
```javascript
import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: '<DeepSeek API Key>'
});

async function main() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        model: "deepseek-chat",
    });
    
    console.log(completion.choices[0].message.content);
}
```

### Implementation Strategy
1. Use OpenAI SDK with DeepSeek base URL
2. Implement fallback to web scraping if API fails
3. Support both streaming and non-streaming responses
4. Add proper error handling and rate limiting

