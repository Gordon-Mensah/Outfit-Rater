// Backend API using Groq (MUCH FASTER!)
// Your API key stays secret here!

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the image and context from the request
    const { image, context } = req.body;

    // Check if we have an image
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Call Groq API with vision model
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}` // Secret! Stays on server
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview', // Groq's vision model (updated)
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              },
              {
                type: 'text',
                text: `You are a friendly but honest fashion expert. Rate this outfit 1-10 and give specific, helpful feedback.

${context ? `Context: This outfit is for ${context}` : ''}

Rating scale:
1-3: Needs major changes
4-6: Decent, but could be better
7-8: Good! Minor tweaks only
9-10: Excellent, very well put together

Focus on:
- Color coordination (do colors work together?)
- Fit (too tight, too loose, or just right?)
- Occasion appropriateness
- Overall style

Be SPECIFIC: Instead of "looks bad", say "the brown shoes don't match the black belt"
Be ENCOURAGING: Always mention what they did RIGHT
Be HELPFUL: Give actionable tips they can use

Format your response like this:
Rating: [number]/10
[Brief overall impression]
What works: [positive things]
What to improve: [specific suggestions]`
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    // Check for errors from Groq
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // Get the text response
    const text = data.choices[0].message.content;

    // Parse out the rating number
    const ratingMatch = text.match(/Rating:\s*(\d+)/i) || text.match(/(\d+)\/10/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 7;

    // Send back the result
    res.status(200).json({
      rating,
      feedback: text,
      success: true
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to rate outfit. Please try again.',
      details: error.message 
    });
  }
}