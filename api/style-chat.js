// api/style-chat.js - AI Style Chat with Image Context
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
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

  const { message, outfitImage, originalRating, originalFeedback, occasion, conversationHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    console.log('💬 Style chat request received');

    // Build context from original rating
    const occasionText = occasion !== 'none' ? `for a ${occasion} occasion` : '';
    const context = `You are a personal AI fashion stylist. You previously analyzed this outfit ${occasionText} and gave it ${originalRating}/10.

Original feedback: "${originalFeedback}"

The user is now asking follow-up questions about their outfit. You can see their outfit image, so give specific advice based on what you see.

Guidelines:
- Give practical, actionable advice
- If they say they don't have something, suggest alternatives with what they DO have
- Be specific about colors, items, and styling
- Keep responses concise (2-4 sentences)
- Be encouraging and supportive
- Reference the outfit image when giving advice

User question: ${message}`;

    // Build conversation with image
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: context
          }
        ]
      }
    ];

    // Add image if provided
    if (outfitImage) {
      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: outfitImage
        }
      });
    }

    console.log('📤 Sending to Groq...');

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.8,
      max_tokens: 300,
      top_p: 1
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

    console.log('✅ Style advice generated');

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('❌ Chat error:', error.message);

    if (error.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    return res.status(500).json({ 
      error: 'Failed to get style advice',
      details: error.message
    });
  }
}