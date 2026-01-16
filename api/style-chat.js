// Add this to your server.js or routes file

app.post('/api/style-chat', async (req, res) => {
  try {
    const { userId, conversation, outfitContext } = req.body

    if (!userId || !conversation) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Build the system prompt with outfit context
    const systemPrompt = `You are an expert AI fashion stylist and personal shopper. You're having a conversation with a user about their outfit that was just rated ${outfitContext.rating}/10 for a ${outfitContext.occasion} occasion.

Original feedback given: "${outfitContext.feedback}"

Your role:
- Help them find alternatives when they don't have suggested items
- Suggest what colors/items work with what they DO have
- Give specific, actionable advice
- Be encouraging and supportive
- Suggest budget-friendly options when asked
- Consider their wardrobe constraints

Guidelines:
- Keep responses concise (2-4 sentences usually)
- Be specific about colors, styles, and combinations
- If they say they don't have something, suggest alternatives with what they likely DO have
- Focus on practical, wearable advice
- Be warm and conversational

Example exchange:
User: "You suggested a blue top but I don't have blue, I have black"
You: "Black is actually a great alternative! A black top would work perfectly here. To add visual interest since black is more muted, I'd suggest adding a colorful accessory - maybe a statement necklace in gold or silver, or a bright scarf. This keeps the outfit polished while adding that pop of personality."

Now respond to the user's message:`

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: conversation
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'AI request failed')
    }

    // Extract the response text
    const aiResponse = data.content[0].text

    res.json({ response: aiResponse })

  } catch (error) {
    console.error('Style chat error:', error)
    res.status(500).json({ 
      error: 'Failed to get style advice',
      details: error.message 
    })
  }
})