// api/compare-outfits.js
// Handles comparing multiple outfits

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
    const { images, occasion, userId } = req.body;

    // Validate data
    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 images to compare' });
    }

    console.log(`🔄 Comparing ${images.length} outfits for user ${userId} - ${occasion}`);

    // Build message content with all images
    const content = [
      {
        type: 'text',
        text: `Compare these ${images.length} outfits for a ${occasion} occasion. For each outfit, give a rating from 1-10. Then identify which outfit is best overall and explain why. Finally, suggest creative ways to mix and match elements from different outfits.`
      },
      ...images.map(img => ({
        type: 'image_url',
        image_url: { url: img }
      }))
    ];

    // Call Groq AI API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      max_tokens: 800
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Extract ratings for each outfit (look for X/10 patterns)
    const ratingMatches = response.match(/\d+\/10/g) || [];
    const ratings = ratingMatches.map(match => parseInt(match)).slice(0, images.length);
    
    // Fill in missing ratings with 7 (in case AI didn't rate all outfits)
    while (ratings.length < images.length) {
      ratings.push(7);
    }

    // Find the best outfit (highest rating)
    const bestIndex = ratings.indexOf(Math.max(...ratings));

    console.log(`✅ Comparison complete. Best: Outfit ${bestIndex + 1} (${ratings[bestIndex]}/10)`);

    // Send response back to frontend
    return res.status(200).json({
      ratings,
      bestIndex,
      analysis: response,
      mixSuggestion: response.includes('mix') ? response : 'Try combining elements from your top-rated outfits!'
    });

  } catch (error) {
    console.error('❌ Groq API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to compare outfits',
      details: error.message 
    });
  }
}