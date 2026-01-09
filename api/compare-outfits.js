// API Endpoint: Compare Multiple Outfits
// File: api/compare-outfits.js

import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { images, occasion, userId } = req.body

    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({ error: 'At least 2 images required for comparison' })
    }

    if (images.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 images can be compared at once' })
    }

    // Prepare messages for Groq vision model
    const content = [
      {
        type: 'text',
        text: `You are a professional fashion stylist. Compare these ${images.length} outfits and provide:
1. Rate each outfit from 1-10
2. Identify which outfit is the best choice${occasion !== 'none' ? ` for ${occasion}` : ''}
3. Provide detailed analysis explaining your choice
4. IMPORTANT: Suggest a mix-and-match combination using items from different outfits (e.g., "Wear the white top from outfit 1 with the black pants from outfit 3")

Be specific about which outfit number you're referring to.
Format your response as JSON:
{
  "ratings": [rating1, rating2, ...],
  "bestIndex": 0,
  "analysis": "detailed comparison",
  "mixSuggestion": "specific mix and match suggestion"
}`
      }
    ]

    // Add all images
    images.forEach((image, index) => {
      content.push({
        type: 'image_url',
        image_url: { url: image }
      })
    })

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No response from AI')
    }

    // Try to parse JSON response
    let result
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        // If no JSON, create structured response from text
        result = {
          ratings: Array(images.length).fill(7), // Default ratings
          bestIndex: 0,
          analysis: responseText,
          mixSuggestion: "Try mixing items from different outfits for unique combinations!"
        }
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      result = {
        ratings: Array(images.length).fill(7),
        bestIndex: 0,
        analysis: responseText,
        mixSuggestion: "Experiment with combining tops and bottoms from different outfits!"
      }
    }

    return res.status(200).json(result)

  } catch (error) {
    console.error('Comparison API error:', error)
    return res.status(500).json({ 
      error: 'Failed to compare outfits',
      details: error.message 
    })
  }
}