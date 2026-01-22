// api/compare-outfits.js - WITH CONTEXT SUPPORT
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

  const { images, occasion, userId, context } = req.body;

  if (!images || images.length < 2) {
    return res.status(400).json({ error: 'Please provide at least 2 images' });
  }

  if (images.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 images allowed' });
  }

  try {
    console.log(`🚀 Comparing ${images.length} outfits...`);
    if (context) {
      console.log('📍 Using user context:', context);
    }

    const occasionText = occasion !== 'none' ? `Occasion: ${occasion}` : '';

    // Build context section
    let contextSection = '';
    if (context && context.city) {
      contextSection = '\n\n🎯 USER CONTEXT:\n';
      
      if (context.city) {
        contextSection += `Location: ${context.cityLabel || context.city} (${context.climate || 'variable'} climate)\n`;
      }
      
      if (context.workplace) {
        contextSection += `Workplace: ${context.workplaceLabel || context.workplace} (${context.formality || 'medium'} formality)\n`;
      }
      
      if (context.socialScene) {
        contextSection += `Social Scene: ${context.socialSceneLabel || context.socialScene}\n`;
      }
      
      contextSection += '\nConsider which outfit works best for their specific situation.\n';
    }

    const prompt = `Compare these ${images.length} outfits and rate each 1-10. Be quick and concise.
${contextSection}
FORMAT (REQUIRED):
Outfit 1: X/10
Outfit 2: X/10
Outfit 3: X/10
(etc)

Best: Outfit X because [1 sentence${context ? ' referencing their context' : ''}]
Mix: [1 quick suggestion]

${occasionText}`;

    const imageMessages = images.map((img) => ({
      type: 'image_url',
      image_url: { url: img }
    }));

    console.log('📤 Sending to Groq API...');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageMessages
          ]
        }
      ],
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1
    });

    console.log('✅ Received AI response');

    const feedback = completion.choices[0]?.message?.content || '';

    // Extract ratings
    const ratings = [];
    for (let i = 1; i <= images.length; i++) {
      const pattern = new RegExp(`outfit ${i}[:\\s]*(\\d+)/10`, 'i');
      const match = feedback.match(pattern);
      if (match) {
        ratings.push(parseInt(match[1]));
      } else {
        ratings.push(7); // Default
      }
    }

    // Find best outfit
    const bestIndex = ratings.indexOf(Math.max(...ratings));

    // Extract analysis
    const analysisMatch = feedback.match(/best:([^]*?)(?:mix:|$)/i);
    const analysis = analysisMatch ? analysisMatch[1].trim().split('\n')[0] : 
                    `Outfit ${bestIndex + 1} scored highest with ${ratings[bestIndex]}/10`;

    // Extract mix suggestion
    const mixMatch = feedback.match(/mix:([^]*?)$/i);
    const mixSuggestion = mixMatch ? mixMatch[1].trim().split('\n')[0] : 
                         'Try mixing elements from your top-rated outfits!';

    console.log('✨ Comparison complete');

    return res.status(200).json({
      ratings,
      bestIndex,
      analysis,
      mixSuggestion,
      contextUsed: !!context
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    return res.status(500).json({ 
      error: 'Failed to compare outfits',
      details: error.message
    });
  }
}