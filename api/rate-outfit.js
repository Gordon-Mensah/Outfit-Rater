// api/rate-outfit.js
// Enhanced AI outfit rating with clean, structured feedback

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  // Allow requests from anywhere (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get data from request
    const { image, occasion, mode, userId } = req.body;

    // Validate data
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const finalOccasion = occasion || 'none';
    const finalMode = mode || 'helpful';

    console.log(`🤖 Rating outfit for user ${userId} - ${finalOccasion} - ${finalMode} mode`);

    // Enhanced prompts that produce clean, readable feedback
    const prompts = {
      helpful: `You are a supportive, professional fashion advisor analyzing this outfit${finalOccasion !== 'none' ? ` for a ${finalOccasion} occasion` : ''}.

TASK: Provide a rating (1-10) and constructive feedback.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
Rating: X/10

[Opening sentence about overall impression]

What Works Well:
- [Specific positive point about fit, color, or style]
- [Another positive observation]

Areas for Improvement:
- [Gentle, specific suggestion]
- [Another constructive tip]

Final Thoughts:
[Encouraging closing statement with 1-2 actionable tips]

STYLE GUIDELINES:
- Be warm, encouraging, and specific
- Focus on what's working before suggesting improvements
- Use clear, conversational language
- Keep each point concise (1-2 sentences max)
- Avoid jargon or overly technical terms`,

      honest: `You are a direct, experienced fashion consultant analyzing this outfit${finalOccasion !== 'none' ? ` for a ${finalOccasion} occasion` : ''}.

TASK: Provide a straightforward rating (1-10) and honest feedback.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
Rating: X/10

[Opening sentence with honest overall assessment]

The Good:
- [What's working]
- [Another strength]

The Not-So-Good:
- [What needs work]
- [Another issue to address]

Bottom Line:
[Straightforward conclusion with clear next steps]

STYLE GUIDELINES:
- Be direct but professional
- No sugar-coating, but remain respectful
- Prioritize actionable, specific advice
- Use clear, plain language
- Keep points brief and punchy`,

      roast: `You are a witty, playful fashion comedian analyzing this outfit${finalOccasion !== 'none' ? ` for a ${finalOccasion} occasion` : ''}.

TASK: Provide a humorous rating (1-10) and entertaining roast-style commentary.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
Rating: X/10

[Clever opening line with a playful jab]

The Highlights (Yes, Really):
- [Something genuinely positive, delivered with humor]
- [Another compliment with a twist]

The Lowlights (Buckle Up):
- [Funny observation about what's not working]
- [Another humorous critique]

Final Roast:
[Witty closing statement with a funny comparison or pop culture reference]

STYLE GUIDELINES:
- Be funny, not mean
- Use clever wordplay and comparisons
- Keep it lighthearted and entertaining
- Balance roasting with actual fashion advice
- Stay PG-13 in humor`,
    };

    // Call Groq AI API with vision model
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompts[finalMode]
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
      max_tokens: 800,
      top_p: 1,
      stream: false
    });

    const response = completion.choices[0]?.message?.content || '';
    
    console.log('Raw AI response:', response);

    // Extract rating from AI response (multiple patterns)
    let rating = 7; // Default rating
    
    // Try different patterns to extract rating
    const ratingPatterns = [
      /Rating:\s*(\d+)\/10/i,
      /(\d+)\/10/,
      /rating[:\s]+(\d+)/i,
      /score[:\s]+(\d+)/i,
      /rate[:\s]+(\d+)/i
    ];

    for (const pattern of ratingPatterns) {
      const match = response.match(pattern);
      if (match) {
        rating = parseInt(match[1]);
        break;
      }
    }

    // Ensure rating is between 1-10
    rating = Math.min(Math.max(rating, 1), 10);

    // Clean up the feedback text
    let cleanedFeedback = response;
    
    // Remove standalone "Rating: X/10" line if it's on its own
    cleanedFeedback = cleanedFeedback.replace(/^Rating:\s*\d+\/10\s*\n+/im, '');
    
    // Clean up excessive newlines
    cleanedFeedback = cleanedFeedback.replace(/\n{3,}/g, '\n\n');
    
    // Trim whitespace
    cleanedFeedback = cleanedFeedback.trim();

    console.log(`✅ Rating complete: ${rating}/10`);
    console.log(`📝 Feedback length: ${cleanedFeedback.length} characters`);

    // Send response back to frontend
    return res.status(200).json({
      rating: rating,
      feedback: cleanedFeedback
    });

  } catch (error) {
    console.error('❌ Groq API Error:', error);

    // Handle specific error types
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'API authentication failed. Please check configuration.' 
      });
    }

    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again in a moment.' 
      });
    }

    if (error.message?.includes('timeout')) {
      return res.status(504).json({ 
        error: 'Request timed out. Please try again with a smaller image.' 
      });
    }

    // Generic error with details in development
    return res.status(500).json({ 
      error: 'Failed to analyze outfit. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}