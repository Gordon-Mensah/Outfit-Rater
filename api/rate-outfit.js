// api/rate-outfit.js - OPTIMIZED for speed
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, occasion, mode = 'helpful', userId } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    console.log('🚀 Starting outfit rating...');

    // SPEED OPTIMIZATION: Shorter, focused prompts
    const prompts = {
      helpful: `Rate this outfit 1-10 and give 3 quick tips. Be concise.

FORMAT:
Rating: X/10
1. [tip]
2. [tip]  
3. [tip]`,

      honest: `Rate this outfit 1-10 honestly. Give 2 good points and 2 areas to improve. Be direct.

FORMAT:
Rating: X/10
Good: [2 points]
Improve: [2 points]`,

      roast: `Rate this outfit 1-10 with humor. Roast it but keep it light. 3-4 sentences max.

FORMAT:
Rating: X/10
[Your roast here]`
    };

    const selectedPrompt = prompts[mode] || prompts.helpful;
    const occasionText = occasion !== 'none' ? `Occasion: ${occasion}` : '';

    console.log('📤 Sending to Groq API...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${selectedPrompt}\n${occasionText}`
            },
            {
              type: 'image_url',
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.7,
      max_tokens: 400,  // REDUCED from 800 for faster response
      top_p: 1
    });

    console.log('✅ Received AI response');

    const feedback = completion.choices[0]?.message?.content || 'Could not generate feedback';
    
    // Extract rating with multiple regex patterns
    let rating = 7; // Default fallback
    const ratingPatterns = [
      /rating:\s*(\d+)\/10/i,
      /(\d+)\/10/i,
      /rating:\s*(\d+)/i,
      /^(\d+)\/10/m
    ];

    for (const pattern of ratingPatterns) {
      const match = feedback.match(pattern);
      if (match) {
        const extractedRating = parseInt(match[1]);
        if (extractedRating >= 1 && extractedRating <= 10) {
          rating = extractedRating;
          break;
        }
      }
    }

    console.log('✨ Rating extracted:', rating);

    return res.status(200).json({
      rating,
      feedback: feedback.trim()
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        details: 'Please check your Groq API key'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please try again in a moment.'
      });
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return res.status(504).json({ 
        error: 'Request timeout',
        details: 'AI took too long to respond. Please try again.'
      });
    }

    return res.status(500).json({ 
      error: 'Failed to rate outfit',
      details: error.message
    });
  }
}