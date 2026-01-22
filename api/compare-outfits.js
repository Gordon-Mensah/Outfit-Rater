// api/compare-outfits.js - WITH CONTEXT + WEATHER SUPPORT
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
      if (context.weather) {
        console.log('🌤️ Weather data:', `${context.weather.temp}°C, ${context.weather.condition}`);
      }
    }

    const occasionText = occasion !== 'none' ? `Occasion: ${occasion}` : '';

    // Build context section
    let contextSection = '';
    if (context && context.city) {
      contextSection = '\n\n🎯 USER CONTEXT:\n';
      
      // Location
      if (context.city) {
        contextSection += `📍 Location: ${context.cityLabel || context.city}\n`;
        contextSection += `   Climate: ${context.climate || 'variable'}\n`;
        if (context.culture) {
          contextSection += `   Local Style: ${context.culture}\n`;
        }
      }
      
      // REAL-TIME WEATHER
      if (context.weather) {
        contextSection += `\n🌤️ CURRENT WEATHER:\n`;
        contextSection += `   Temperature: ${context.weather.temp}°C\n`;
        contextSection += `   Condition: ${context.weather.condition} (${context.weather.description})\n`;
        if (context.weather.humidity) {
          contextSection += `   Humidity: ${context.weather.humidity}%\n`;
        }
        contextSection += `\n   ⚠️ Consider which outfit is best for ${context.weather.temp}°C ${context.weather.condition.toLowerCase()} weather!\n`;
      }
      
      // Workplace
      if (context.workplace) {
        contextSection += `\n💼 Workplace: ${context.workplaceLabel || context.workplace}\n`;
        contextSection += `   Formality: ${context.formality || 'medium'}\n`;
      }
      
      // Social Scene
      if (context.socialScene) {
        contextSection += `\n👥 Social Scene: ${context.socialSceneLabel || context.socialScene}\n`;
      }
      
      contextSection += '\n⚠️ IMPORTANT: Compare outfits considering:\n';
      contextSection += `- Which works best for ${context.cityLabel || context.city}\n`;
      if (context.weather) {
        contextSection += `- Which is most appropriate for ${context.weather.temp}°C ${context.weather.condition.toLowerCase()} weather\n`;
      }
      if (context.workplace) {
        contextSection += `- Which fits ${context.workplaceLabel} dress code\n`;
      }
      if (context.socialScene) {
        contextSection += `- Which matches ${context.socialSceneLabel} style\n`;
      }
    }

    const prompt = `Compare these ${images.length} outfits and rate each 1-10. Be quick and concise.
${contextSection}

FORMAT (REQUIRED):
Outfit 1: X/10
Outfit 2: X/10
Outfit 3: X/10
${images.length > 3 ? 'Outfit 4: X/10\n' : ''}${images.length > 4 ? 'Outfit 5: X/10\n' : ''}
Best: Outfit X because [1 sentence${context ? ` - mention ${context.cityLabel || 'location'}` : ''}${context && context.weather ? ` and ${context.weather.temp}°C weather` : ''}]
Mix: [1 quick suggestion${context ? ' for their situation' : ''}]

${occasionText}

${context && context.weather ? `WEATHER TIP: At ${context.weather.temp}°C ${context.weather.condition.toLowerCase()}, ${context.weather.temp > 25 ? 'breathable fabrics are key' : context.weather.temp < 10 ? 'warm layers are essential' : 'moderate layers work well'}.` : ''}`;

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
      max_tokens: 600, // Increased for context-aware feedback
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
    let analysis = '';
    if (analysisMatch) {
      analysis = analysisMatch[1].trim().split('\n')[0];
    } else {
      // Build default analysis
      analysis = `Outfit ${bestIndex + 1} scored highest with ${ratings[bestIndex]}/10`;
      if (context && context.weather) {
        analysis += ` - best suited for ${context.weather.temp}°C ${context.weather.condition.toLowerCase()} weather`;
      } else if (context && context.city) {
        analysis += ` for ${context.cityLabel}`;
      }
    }

    // Extract mix suggestion
    const mixMatch = feedback.match(/mix:([^]*?)$/i);
    let mixSuggestion = '';
    if (mixMatch) {
      mixSuggestion = mixMatch[1].trim().split('\n')[0];
    } else {
      mixSuggestion = 'Try mixing elements from your top-rated outfits!';
      if (context && context.weather) {
        if (context.weather.temp > 25) {
          mixSuggestion = 'Mix lighter fabrics and breathable materials for the warm weather.';
        } else if (context.weather.temp < 10) {
          mixSuggestion = 'Layer warmer pieces from your best outfits for the cold weather.';
        }
      }
    }

    console.log('✨ Comparison complete');
    if (context && context.weather) {
      console.log('🌤️ Weather context applied:', `${context.weather.temp}°C, ${context.weather.condition}`);
    }

    return res.status(200).json({
      ratings,
      bestIndex,
      analysis,
      mixSuggestion,
      contextUsed: !!context,
      weatherUsed: !!(context && context.weather)
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