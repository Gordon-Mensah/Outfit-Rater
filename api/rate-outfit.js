// 📚 WHAT IS THIS FILE?
// This is the BACKEND API that talks to the Groq AI model.
// It receives an image from the frontend, sends it to Groq,
// and returns the rating and feedback.

export default async function handler(req, res) {
  // ✅ CORS Headers (allows frontend to call this API)
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 📥 GET DATA from frontend
    const { image, occasion, mode = 'helpful', userId } = req.body

    if (!image) {
      return res.status(400).json({ error: 'No image provided' })
    }

    console.log('🎯 Rating outfit for user:', userId || 'anonymous')
    console.log('🎭 Mode:', mode)
    console.log('📍 Occasion:', occasion)

    // 🎭 CREATE PROMPT based on feedback mode
    let systemPrompt = ''

    if (mode === 'roast') {
      // 🔥 ROAST MODE - Funny but still helpful
      systemPrompt = `You are a hilarious fashion comedian with a sharp wit. Roast this outfit with clever jokes and funny observations, but ALWAYS include genuine helpful advice too.

Rating scale:
1-3: Fashion emergency! 🚨
4-6: Room for improvement 🤔
7-8: Pretty good! 😊
9-10: Killing it! 🔥

Be funny but NOT mean. Make jokes about:
- Questionable color choices
- Odd combinations
- Style mismatches
But ALWAYS end with real, helpful suggestions.

Format:
Rating: [number]/10
[Roast them hilariously but kindly - 2-3 funny observations]
Real talk: [Actual helpful advice on what to change]
What actually works: [Something positive]`
    } else if (mode === 'honest') {
      // 🤔 HONEST MODE - Direct and straightforward
      systemPrompt = `You are a straightforward fashion expert who tells it like it is. Be direct and honest without sugar-coating, but remain respectful and constructive.

Rating scale:
1-3: Needs significant changes
4-6: Okay, but several issues to address
7-8: Good, minor improvements needed
9-10: Excellent, well executed

Be blunt about:
- What doesn't work and why
- Specific problems with fit, color, or style
- Realistic improvements needed

Format:
Rating: [number]/10
What's not working: [Direct honest assessment]
What you need to fix: [Specific actionable changes]
What's actually good: [Something positive, if applicable]`
    } else {
      // 😊 HELPFUL MODE (default) - Encouraging and constructive
      systemPrompt = `You are a friendly and encouraging fashion expert. Rate this outfit 1-10 and give specific, helpful feedback that builds confidence.

Rating scale:
1-3: Needs major changes, but we can fix this!
4-6: Decent start, let's improve a few things
7-8: Looking good! Just minor tweaks needed
9-10: Excellent! Very well put together

Focus on:
- Color coordination
- Fit (too tight, too loose, or just right?)
- Occasion appropriateness for: ${occasion}
- Overall style harmony

Be SPECIFIC: Instead of "looks bad", say "the brown shoes clash with the black belt"
Be ENCOURAGING: Always mention what they did RIGHT first
Be HELPFUL: Give actionable tips they can use immediately

Format:
Rating: [number]/10
[Brief overall impression]
What works: [Positive things - be specific!]
What to improve: [Specific, actionable suggestions]
Pro tip: [One insider fashion tip]`
    }

    // 🤖 CALL GROQ API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: image,
                },
              },
              {
                type: 'text',
                text: systemPrompt,
              },
            ],
          },
        ],
        temperature: mode === 'roast' ? 0.9 : 0.7, // Higher temp for roast mode = more creative
        max_tokens: 1000,
      }),
    })

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json()
      console.error('Groq API error:', errorData)
      throw new Error(errorData.error?.message || 'Groq API request failed')
    }

    const data = await groqResponse.json()
    const aiResponse = data.choices[0].message.content

    console.log('🤖 AI Response:', aiResponse)

    // 🔍 PARSE THE RESPONSE
    // Extract rating (looking for "Rating: X/10")
    const ratingMatch = aiResponse.match(/Rating:\s*(\d+)\/10/i)
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5

    // Remove the rating line from feedback
    const feedback = aiResponse.replace(/Rating:\s*\d+\/10/i, '').trim()

    // 📤 SEND RESPONSE back to frontend
    return res.status(200).json({
      rating,
      feedback,
      mode, // Include mode so frontend knows which style was used
      occasion,
    })

  } catch (error) {
    console.error('❌ Error in rate-outfit:', error)
    return res.status(500).json({
      error: error.message || 'Failed to rate outfit. Please try again.',
    })
  }
}

// 📖 HOW THIS WORKS:
//
// 1. Frontend sends: { image, occasion, mode, userId }
// 2. We choose the right prompt based on mode:
//    - helpful = encouraging and constructive
//    - honest = direct and straightforward
//    - roast = funny but still helpful
// 3. We send image + prompt to Groq API
// 4. Groq's Llama 4 Scout analyzes the image
// 5. AI returns text with rating and feedback
// 6. We parse the rating number
// 7. Send back to frontend: { rating, feedback, mode }
// 8. Frontend displays it to user!