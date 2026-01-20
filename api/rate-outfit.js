// api/rate-outfit.js - OPTIMIZED with FULL 0-10 RATING RANGE
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

    // UPDATED PROMPTS: Full 0-10 range with clear scoring guidance
    const prompts = {
      helpful: `You are a brutally honest fashion expert. Rate this outfit from 0-10 where:

0-2 = Fashion disaster, completely wrong for the occasion
3-4 = Poor choices, needs major improvements
5-6 = Mediocre/average, significant room for improvement
7-8 = Good outfit, minor tweaks would help
9-10 = Excellent, very well-styled

BE HONEST and use the FULL SCALE. Don't cluster around 7-8. Give low ratings to bad outfits and high ratings to great ones.

FORMAT:
Rating: X/10
1. [tip]
2. [tip]  
3. [tip]`,

      honest: `You are a fashion critic. Rate this outfit 0-10 HONESTLY using the FULL scale:

0-2 = Disaster/awful
3-4 = Poor/needs work
5-6 = Average/mediocre
7-8 = Good/solid
9-10 = Excellent/outstanding

Don't be afraid to give LOW ratings for bad outfits or HIGH ratings for exceptional ones. Be REALISTIC.

FORMAT:
Rating: X/10
Good: [2 points]
Improve: [2 points]`,

      roast: `You are a savage fashion roaster. Rate this outfit 0-10 with BRUTAL honesty:

0-3 = ROAST IT MERCILESSLY (fashion crime)
4-6 = Decent roast (meh outfit)
7-8 = Light roast (pretty good)
9-10 = Compliment with humor (fire outfit)

Use the FULL scale. Don't hold back on bad outfits! Roast hard if deserved.

FORMAT:
Rating: X/10
[Your roast here - be savage if rating is low, funny if high]`
    };

    const selectedPrompt = prompts[mode] || prompts.helpful;
    const occasionText = occasion !== 'none' ? `\nOccasion: ${occasion}` : '';

    console.log('📤 Sending to Groq API...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${selectedPrompt}${occasionText}`
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
      temperature: 0.8,  // Increased from 0.7 for more varied ratings
      max_tokens: 400,
      top_p: 1
    });

    console.log('✅ Received AI response');

    const feedback = completion.choices[0]?.message?.content || 'Could not generate feedback';
    
    // Extract rating with multiple regex patterns
    let rating = null;
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
        if (extractedRating >= 0 && extractedRating <= 10) {  // Changed from >= 1 to >= 0
          rating = extractedRating;
          break;
        }
      }
    }

    // If no valid rating found, default to 5 (neutral)
    if (rating === null) {
      rating = 5;
      console.log('⚠️ No rating found, defaulting to 5');
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