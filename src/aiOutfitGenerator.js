// aiOutfitGenerator.js
// AI-Powered Outfit Generation (Premium Feature)
// This uses your existing Groq API to generate smart outfit combinations

import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

/**
 * Generate AI-powered outfit combinations
 * @param {Object} wardrobe - User's wardrobe organized by category
 * @param {string} occasion - Occasion for the outfit (optional)
 * @param {string} weather - Weather condition (optional)
 * @param {number} count - Number of outfits to generate (default: 5)
 * @returns {Promise<Array>} - Array of outfit combinations with AI reasoning
 */
export async function generateAIOutfits(wardrobe, occasion = 'casual', weather = 'moderate', count = 5) {
  try {
    // Build a description of available items
    const wardrobeDescription = buildWardrobeDescription(wardrobe)
    
    // Create prompt for AI
    const prompt = `You are a professional fashion stylist. Based on this wardrobe, create ${count} outfit combinations for a ${occasion} occasion in ${weather} weather.

Available wardrobe:
${wardrobeDescription}

For each outfit, provide:
1. Which specific items to combine (by their numbers)
2. Why this combination works
3. Style tips or accessories suggestions
4. A 1-10 rating for how well it matches the occasion

Format your response as a JSON array with this structure:
[
  {
    "outfit_number": 1,
    "items": {
      "top": "item number from tops",
      "bottom": "item number from bottoms",
      "shoes": "item number from shoes",
      "outerwear": "item number or null",
      "accessory": "suggestion or null"
    },
    "reasoning": "Why this combination works",
    "style_tips": "Additional styling advice",
    "occasion_rating": 8
  }
]

Be creative but practical. Focus on color coordination, style matching, and appropriateness for the occasion.`

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional fashion stylist who creates practical, stylish outfit combinations. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 2000
    })

    const response = completion.choices[0]?.message?.content || '[]'
    
    // Parse AI response
    const aiOutfits = parseAIResponse(response)
    
    // Map AI suggestions to actual wardrobe items
    const outfits = mapAIToActualItems(aiOutfits, wardrobe)
    
    return outfits

  } catch (error) {
    console.error('AI Outfit Generation Error:', error)
    // Fallback to random generation if AI fails
    return generateFallbackOutfits(wardrobe, count)
  }
}

/**
 * Build a text description of the wardrobe for AI
 */
function buildWardrobeDescription(wardrobe) {
  let description = ''
  
  Object.keys(wardrobe).forEach(category => {
    if (wardrobe[category].length > 0) {
      description += `\n${category.toUpperCase()}:\n`
      wardrobe[category].forEach((item, index) => {
        description += `  ${index + 1}. ${item.name} (${item.color || 'color unknown'})\n`
      })
    }
  })
  
  return description
}

/**
 * Parse AI response, handling potential JSON errors
 */
function parseAIResponse(response) {
  try {
    // Remove markdown code blocks if present
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return []
  }
}

/**
 * Map AI outfit numbers to actual wardrobe items
 */
function mapAIToActualItems(aiOutfits, wardrobe) {
  return aiOutfits.map(outfit => {
    const items = outfit.items
    
    return {
      id: `ai-outfit-${outfit.outfit_number}`,
      occasion: outfit.occasion || 'general',
      reasoning: outfit.reasoning,
      style_tips: outfit.style_tips,
      rating: outfit.occasion_rating,
      top: getItemByNumber(wardrobe.tops, items.top),
      bottom: getItemByNumber(wardrobe.bottoms, items.bottom),
      shoes: getItemByNumber(wardrobe.shoes, items.shoes),
      outerwear: items.outerwear ? getItemByNumber(wardrobe.outerwear, items.outerwear) : null,
      accessory: items.accessory ? { suggestion: items.accessory } : null
    }
  }).filter(outfit => outfit.top && outfit.bottom && outfit.shoes) // Only return complete outfits
}

/**
 * Get item by its number in the array
 */
function getItemByNumber(items, number) {
  if (!number || !items || items.length === 0) return null
  const index = parseInt(number) - 1
  return items[index] || null
}

/**
 * Fallback: Generate random outfits if AI fails
 */
function generateFallbackOutfits(wardrobe, count) {
  const { tops, bottoms, shoes, outerwear, accessories } = wardrobe
  const outfits = []

  for (let i = 0; i < Math.min(count, tops.length); i++) {
    const outfit = {
      id: `fallback-outfit-${i}`,
      top: tops[i] || tops[0],
      bottom: bottoms[Math.floor(Math.random() * bottoms.length)],
      shoes: shoes[Math.floor(Math.random() * shoes.length)],
      outerwear: outerwear.length > 0 ? outerwear[Math.floor(Math.random() * outerwear.length)] : null,
      accessory: accessories.length > 0 ? accessories[Math.floor(Math.random() * accessories.length)] : null,
      occasion: ['casual', 'work', 'date', 'night out'][Math.floor(Math.random() * 4)],
      reasoning: 'Random combination',
      style_tips: 'Consider accessorizing to complete the look',
      rating: Math.floor(Math.random() * 3) + 6 // 6-8 rating
    }
    outfits.push(outfit)
  }

  return outfits
}

/**
 * Analyze wardrobe and suggest missing items (AI-powered)
 */
export async function analyzeWardrobeGaps(wardrobe) {
  try {
    const wardrobeDescription = buildWardrobeDescription(wardrobe)
    
    const prompt = `You are a professional wardrobe consultant. Analyze this wardrobe and suggest what items are missing or needed to create a complete, versatile wardrobe.

Current wardrobe:
${wardrobeDescription}

Provide 5-7 specific suggestions with:
1. Item type and description
2. Why it's needed
3. Priority level (high/medium/low)
4. Estimated price range

Format as JSON:
[
  {
    "item": "White button-down shirt",
    "category": "tops",
    "reason": "Essential basic that pairs with everything",
    "priority": "high",
    "price_range": "$30-60"
  }
]`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a wardrobe consultant who provides practical shopping advice. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500
    })

    const response = completion.choices[0]?.message?.content || '[]'
    return parseAIResponse(response)

  } catch (error) {
    console.error('Wardrobe Analysis Error:', error)
    return getDefaultSuggestions()
  }
}

/**
 * Default suggestions if AI fails
 */
function getDefaultSuggestions() {
  return [
    {
      item: 'White button-down shirt',
      category: 'tops',
      reason: 'Essential basic that pairs with everything',
      priority: 'high',
      price_range: '$30-60'
    },
    {
      item: 'Dark wash jeans',
      category: 'bottoms',
      reason: 'Versatile and appropriate for many occasions',
      priority: 'high',
      price_range: '$40-80'
    },
    {
      item: 'Neutral sneakers',
      category: 'shoes',
      reason: 'Comfortable daily option',
      priority: 'medium',
      price_range: '$50-100'
    }
  ]
}

/**
 * Calculate wardrobe diversity score
 */
export function calculateDiversityScore(wardrobe) {
  const scores = {
    variety: 0,
    colors: 0,
    occasions: 0,
    balance: 0
  }

  // Variety score (different categories)
  const categories = Object.keys(wardrobe)
  const filledCategories = categories.filter(cat => wardrobe[cat].length > 0).length
  scores.variety = (filledCategories / categories.length) * 25

  // Color diversity (simplified - you could enhance this)
  const allColors = new Set()
  Object.values(wardrobe).flat().forEach(item => {
    if (item.color && item.color !== 'unspecified') {
      allColors.add(item.color)
    }
  })
  scores.colors = Math.min((allColors.size / 10) * 25, 25)

  // Balance score (no category has >50% of items)
  const totalItems = Object.values(wardrobe).flat().length
  const isBalanced = Object.values(wardrobe).every(items => 
    items.length / totalItems < 0.5
  )
  scores.balance = isBalanced ? 25 : 10

  // Occasions coverage (basic estimation)
  scores.occasions = Math.min((totalItems / 20) * 25, 25)

  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0))
}

// USAGE EXAMPLES:
/*
// In VirtualWardrobe.jsx, replace the generateOutfits function:

import { generateAIOutfits, analyzeWardrobeGaps, calculateDiversityScore } from './aiOutfitGenerator'

const generateOutfits = async () => {
  const totalItems = Object.values(wardrobe).flat().length
  
  if (totalItems < 3) {
    alert('Add at least 3 items to generate outfits!')
    return
  }

  setLoading(true)
  setActiveTab('outfits')

  try {
    // Use AI for Premium users
    if (isPremium) {
      const outfits = await generateAIOutfits(
        wardrobe, 
        'casual', // or get from user input
        'moderate', 
        5
      )
      setGeneratedOutfits(outfits)
    } else {
      // Use basic random generation for free users
      const outfits = generateFallbackOutfits(wardrobe, 5)
      setGeneratedOutfits(outfits)
    }
  } catch (err) {
    console.error('Error generating outfits:', err)
    alert('Failed to generate outfits')
  } finally {
    setLoading(false)
  }
}
*/