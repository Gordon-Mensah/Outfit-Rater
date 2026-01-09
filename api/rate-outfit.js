// api/rate-outfit.js
// Handles AI outfit rating

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
    if (!image || !occasion || !mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`🤖 Rating outfit for user ${userId} - ${occasion} - ${mode} mode`);

    // Different prompts for different feedback modes
    const prompts = {
      helpful: `You are a supportive fashion advisor. Analyze this outfit for a ${occasion} occasion. Give a rating from 1-10 and provide encouraging, constructive feedback focusing on what works well and gentle suggestions for improvement.`,
      
      honest: `You are a direct, honest fashion critic. Analyze this outfit for a ${occasion} occasion. Give a rating from 1-10 and provide straightforward, no-nonsense feedback about what works and what doesn't.`,
      
      roast: `You are a playful, witty fashion roaster. Analyze this outfit for a ${occasion} occasion. Give a rating from 1-10 and provide humorous, clever roast-style commentary. Be funny but not mean-spirited.`
    };

    // Call Groq AI API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompts[mode]
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
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Extract rating from AI response (look for X/10 pattern)
    const ratingMatch = response.match(/(\d+)\/10|rating[:\s]+(\d+)|score[:\s]+(\d+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3]) : 7;

    console.log(`✅ Rating complete: ${rating}/10`);

    // Send response back to frontend
    return res.status(200).json({
      rating: Math.min(Math.max(rating, 1), 10), // Ensure rating is between 1-10
      feedback: response
    });

  } catch (error) {
    console.error('❌ Groq API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze outfit',
      details: error.message 
    });
  }
}