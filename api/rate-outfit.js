// api/rate-outfit.js - WITH CONTEXT + WEATHER SUPPORT
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

  const { image, occasion, mode = 'helpful', userId, context } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    console.log('🚀 Starting outfit rating...');
    if (context) {
      console.log('📍 Using user context:', context);
      if (context.weather) {
        console.log('🌤️ Weather data:', `${context.weather.temp}°C, ${context.weather.condition}`);
      }
    }

    // Define feedback tones based on mode
    const modeTones = {
      helpful: "encouraging and constructive",
      honest: "balanced and realistic", 
      roast: "brutally honest with humor"
    };

    const tone = modeTones[mode] || modeTones.helpful;
    const occasionText = occasion !== 'none' ? ` for a ${occasion} occasion` : '';

    // Build context section
    let contextSection = '';
    if (context && context.city) {
      contextSection = '\n\n🎯 USER CONTEXT:\n';
      
      // Location info
      if (context.city) {
        contextSection += `📍 Location: ${context.cityLabel || context.city}\n`;
        contextSection += `   General Climate: ${context.climate || 'variable'}\n`;
        if (context.culture) {
          contextSection += `   Local Fashion Style: ${context.culture}\n`;
        }
      }
      
      // REAL-TIME WEATHER DATA
      if (context.weather) {
        contextSection += `\n🌤️ CURRENT WEATHER CONDITIONS:\n`;
        contextSection += `   Temperature: ${context.weather.temp}°C\n`;
        contextSection += `   Condition: ${context.weather.condition} (${context.weather.description})\n`;
        if (context.weather.humidity) {
          contextSection += `   Humidity: ${context.weather.humidity}%\n`;
        }
        contextSection += `\n   ⚠️ CRITICAL: You MUST evaluate if this outfit is appropriate for ${context.weather.temp}°C ${context.weather.condition.toLowerCase()} weather!\n`;
        contextSection += `   Comment on fabric breathability, layering, and weather suitability.\n`;
      }
      
      // Workplace info
      if (context.workplace) {
        contextSection += `\n💼 Workplace: ${context.workplaceLabel || context.workplace}\n`;
        contextSection += `   Formality Level: ${context.formality || 'medium'}\n`;
        if (context.workplaceDescription) {
          contextSection += `   Dress Code: ${context.workplaceDescription}\n`;
        }
      }
      
      // Social scene
      if (context.socialScene) {
        contextSection += `\n👥 Social Scene: ${context.socialSceneLabel || context.socialScene}\n`;
        if (context.sceneDescription) {
          contextSection += `   Style Expectation: ${context.sceneDescription}\n`;
        }
      }
      
      // Age group
      if (context.ageGroup) {
        contextSection += `\n👤 Age Group: ${context.ageGroup}\n`;
      }
      
      // Critical instructions
      contextSection += '\n⚠️ CRITICAL REQUIREMENTS:\n';
      contextSection += '1. You MUST directly reference their location';
      if (context.weather) {
        contextSection += ' AND current weather conditions (temperature, conditions)';
      }
      contextSection += '\n2. You MUST compare this outfit to what people actually wear in their specific situation\n';
      contextSection += '3. You MUST mention their workplace formality or social scene in your feedback\n';
      if (context.weather) {
        contextSection += '4. You MUST evaluate fabric appropriateness for the current temperature and humidity\n';
        contextSection += '5. If weather is extreme (very hot/cold/rainy), prioritize weather suitability in your rating\n';
      }
    }

    // Build the complete prompt
    const prompt = `You are a professional fashion consultant analyzing this outfit${occasionText}.

RATING SCALE (use the FULL range 0-10):
0-2 = Fashion disaster, completely wrong
3-4 = Poor choices, needs major work
5-6 = Average/mediocre, room for improvement
7-8 = Good outfit, minor tweaks needed
9-10 = Excellent, very well-styled
${contextSection}

Your task:
1. Look at the outfit carefully
2. ${context ? `Consider:
   - How it fits their location (${context.cityLabel || context.city})
   ${context.weather ? `- Current weather: ${context.weather.temp}°C, ${context.weather.condition}` : ''}
   ${context.workplace ? `- Workplace: ${context.workplaceLabel}` : ''}
   ${context.socialScene ? `- Social scene: ${context.socialSceneLabel}` : ''}` : 'Evaluate based on general fashion principles'}
3. Decide on ONE rating (0-10)
4. Write feedback that matches that rating${context ? ' and DIRECTLY references their context' : ''}

Be ${tone} in your feedback.

${context && context.weather ? `EXAMPLE for weather-aware feedback:
"For ${context.cityLabel}'s current ${context.weather.temp}°C ${context.weather.condition.toLowerCase()} weather${context.workplace ? ` and ${context.workplaceLabel} environment` : ''}, this outfit ${context.weather.temp > 25 ? 'is too warm - those heavy fabrics will be uncomfortable' : context.weather.temp < 10 ? 'needs more layering for the cold' : 'works well'}..."` : context ? `EXAMPLE:
"For ${context.cityLabel}'s ${context.climate} climate and ${context.workplaceLabel || 'your workplace'}, this outfit works well because..."` : ''}

CRITICAL: The rating number you choose MUST match your written feedback. If you rate it 7/10, your feedback should reflect a "good outfit with minor tweaks." If you rate it 3/10, your feedback should reflect "poor choices."

Respond in this EXACT format:
Rating: X/10

**What works well:**
[2-3 specific points${context ? ' that reference their location' : ''}${context && context.weather ? ', current weather' : ''}${context && context.workplace ? ', and workplace' : ''}]

**What could be improved:**
[2 specific suggestions${context ? ' tailored to their situation' : ''}${context && context.weather ? ' and weather conditions' : ''}]

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
      max_tokens: 700, // Increased for weather-aware feedback
      top_p: 1
    });

    console.log('✅ Received AI response');

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
          console.log('⭐ Rating extracted:', rating);
          break;
        }
      }
    }

    // Fallback: if no rating found, default to 5
    if (rating === null) {
      rating = 5;
      console.log('⚠️ No rating found, defaulting to 5');
    }

    // Log for debugging
    console.log('✅ Final rating:', rating);
    console.log('📝 Feedback preview:', feedback.substring(0, 100));
    if (context && context.weather) {
      console.log('🌤️ Weather context used:', `${context.weather.temp}°C, ${context.weather.condition}`);
    }

    return res.status(200).json({
      rating,
      feedback: feedback.trim(),
      contextUsed: !!context,
      weatherUsed: !!(context && context.weather)
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