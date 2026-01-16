// api/style-chat.js - Backend API for Premium Style Chat
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, originalRating, originalFeedback, occasion, conversationHistory } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Build conversation context
    const systemPrompt = `You are an expert AI fashion consultant and personal stylist. You're chatting with a user about their outfit that received a ${originalRating}/10 rating.

Original Feedback: "${originalFeedback}"
Occasion: ${occasion || 'casual'}

Your role:
- Help users find alternatives when they don't have suggested items
- Suggest color combinations and substitutions
- Recommend accessories, shoes, and styling tips
- Provide budget-friendly shopping alternatives
- Be conversational, friendly, and helpful
- Keep responses concise (2-3 sentences max)
- Be specific and actionable

If they say they don't have a color/item you suggested, immediately suggest practical alternatives they might have in their wardrobe.`

    // Build message history for context
    const messages = [
      { role: 'system', content: systemPrompt }
    ]

    // Add conversation history (last 6 messages for context)
    const recentHistory = conversationHistory.slice(-6)
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        })
      }
    })

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1,
      stream: false
    })

    const reply = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response. Please try again.'

    return res.status(200).json({ reply })

  } catch (error) {
    console.error('Style chat error:', error)
    return res.status(500).json({ 
      error: 'Failed to get style advice',
      details: error.message 
    })
  }
}