// api/rate-outfit.js - FIXED: Single Rating, No Mismatch
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

    // Define feedback tones based on mode
    const modeTones = {
      helpful: "encouraging and constructive",
      honest: "balanced and realistic", 
      roast: "brutally honest with humor"
    };

    const tone = modeTones[mode] || modeTones.helpful;
    const occasionText = occasion !== 'none' ? ` for a ${occasion} occasion` : '';

    // SINGLE PROMPT: Get rating and feedback in ONE call
    const prompt = `You are a professional fashion consultant analyzing this outfit${occasionText}.

RATING SCALE (use the FULL range 0-10):
0-2 = Fashion disaster, completely wrong
3-4 = Poor choices, needs major work
5-6 = Average/mediocre, room for improvement
7-8 = Good outfit, minor tweaks needed
9-10 = Excellent, very well-styled

Your task:
1. Look at the outfit carefully
2. Decide on ONE rating (0-10)
3. Write feedback that matches that rating

Be ${tone} in your feedback.

CRITICAL: The rating number you choose MUST match your written feedback. If you rate it 7/10, your feedback should reflect a "good outfit with minor tweaks." If you rate it 3/10, your feedback should reflect "poor choices."

Respond in this EXACT format:
Rating: X/10

**What works well:**
[2-3 specific points]

**What could be improved:**
[2 specific suggestions]

Remember: Your rating number and written feedback MUST be consistent!`;

    console.log('📤 Sending to Groq API...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
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
      temperature: 0.8,
      max_tokens: 500,
      top_p: 1
    });

    console.log(' Received AI response');

    const feedback = completion.choices[0]?.message?.content || 'Could not generate feedback';
    
    // Extract rating from the response
    let rating = null;
    const ratingPatterns = [
      /rating:\s*(\d+)\/10/i,
      /^(\d+)\/10/m,
      /rating:\s*(\d+)/i,
      /(\d+)\s*\/\s*10/
    ];

    for (const pattern of ratingPatterns) {
      const match = feedback.match(pattern);
      if (match) {
        const extractedRating = parseInt(match[1]);
        if (extractedRating >= 0 && extractedRating <= 10) {
          rating = extractedRating;
          console.log(' Rating extracted:', rating);
          break;
        }
      }
    }

    // Fallback: if no rating found, default to 5
    if (rating === null) {
      rating = 5;
      console.log(' No rating found, defaulting to 5');
    }

    // Log for debugging
    console.log(' Final rating:', rating);
    console.log('Feedback preview:', feedback.substring(0, 100));

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