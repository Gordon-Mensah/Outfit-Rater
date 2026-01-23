// styleMemory.js - AI Style Learning System

/**
 * STYLE MEMORY SYSTEM
 * This system tracks user behavior and builds a style profile
 * It learns what users love, wear, avoid, and prefer
 */

// ===== STYLE PROFILE STRUCTURE =====
export const createEmptyStyleProfile = () => ({
  // Color preferences (learns from all interactions)
  colors: {
    loved: {},      // { 'black': 15, 'white': 12, 'red': 8 }
    avoided: {},    // { 'yellow': 5, 'orange': 3 }
    lastUpdated: new Date().toISOString()
  },
  
  // Silhouette preferences (fitted, loose, oversized, etc.)
  silhouettes: {
    loved: {},      // { 'fitted': 10, 'oversized': 8 }
    avoided: {},    // { 'tight': 5 }
    lastUpdated: new Date().toISOString()
  },
  
  // Combination patterns (what they wear together)
  combinations: {
    successful: [], // [{ top: 'black_tshirt', bottom: 'blue_jeans', count: 5 }]
    rejected: [],   // [{ top: 'red_shirt', bottom: 'green_pants', count: 2 }]
    lastUpdated: new Date().toISOString()
  },
  
  // Occasion preferences
  occasions: {
    frequent: {},   // { 'casual': 20, 'work': 15, 'party': 3 }
    lastUpdated: new Date().toISOString()
  },
  
  // Texture/pattern preferences
  textures: {
    loved: {},      // { 'cotton': 10, 'denim': 8, 'silk': 2 }
    avoided: {},    // { 'polyester': 5 }
    lastUpdated: new Date().toISOString()
  },
  
  // Fit preferences
  fits: {
    loved: {},      // { 'regular': 12, 'slim': 8 }
    avoided: {},    // { 'baggy': 3 }
    lastUpdated: new Date().toISOString()
  },
  
  // Brand preferences (optional)
  brands: {
    loved: {},      // { 'nike': 5, 'zara': 3 }
    avoided: {},    // { 'forever21': 2 }
    lastUpdated: new Date().toISOString()
  },
  
  // Overall stats
  stats: {
    totalLikes: 0,
    totalWears: 0,
    totalDeletes: 0,
    totalRejects: 0,
    totalUploads: 0,
    learningScore: 0, // 0-100, how much we've learned
    lastActivity: new Date().toISOString()
  }
})

// ===== EXTRACT STYLE ATTRIBUTES FROM ITEM =====
export const extractStyleAttributes = (item) => {
  const attributes = {
    colors: [],
    silhouette: null,
    texture: null,
    fit: null,
    brand: null,
    category: null
  }
  
  // Extract color
  if (item.color && item.color !== 'unspecified') {
    attributes.colors.push(item.color.toLowerCase())
  }
  
  // Extract from name (e.g., "Black Skinny Jeans" → black, skinny)
  if (item.name) {
    const nameLower = item.name.toLowerCase()
    
    // Colors
    const colorWords = ['black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'beige', 'navy', 'cream']
    colorWords.forEach(color => {
      if (nameLower.includes(color) && !attributes.colors.includes(color)) {
        attributes.colors.push(color)
      }
    })
    
    // Silhouettes
    if (nameLower.includes('oversized') || nameLower.includes('baggy')) {
      attributes.silhouette = 'oversized'
    } else if (nameLower.includes('fitted') || nameLower.includes('tight') || nameLower.includes('skinny')) {
      attributes.silhouette = 'fitted'
    } else if (nameLower.includes('loose') || nameLower.includes('relaxed')) {
      attributes.silhouette = 'loose'
    } else if (nameLower.includes('regular')) {
      attributes.silhouette = 'regular'
    }
    
    // Textures
    const textureWords = ['cotton', 'denim', 'leather', 'silk', 'wool', 'polyester', 'linen', 'velvet']
    textureWords.forEach(texture => {
      if (nameLower.includes(texture)) {
        attributes.texture = texture
      }
    })
  }
  
  // Brand
  if (item.brand) {
    attributes.brand = item.brand.toLowerCase()
  }
  
  // Category
  if (item.category) {
    attributes.category = item.category
  }
  
  return attributes
}

// ===== TRACK USER ACTION =====
export const trackStyleAction = (styleProfile, action, item, metadata = {}) => {
  const updatedProfile = { ...styleProfile }
  const attributes = extractStyleAttributes(item)
  
  switch (action) {
    case 'LIKE':
      // User liked this outfit/item
      attributes.colors.forEach(color => {
        updatedProfile.colors.loved[color] = (updatedProfile.colors.loved[color] || 0) + 1
      })
      if (attributes.silhouette) {
        updatedProfile.silhouettes.loved[attributes.silhouette] = (updatedProfile.silhouettes.loved[attributes.silhouette] || 0) + 1
      }
      if (attributes.texture) {
        updatedProfile.textures.loved[attributes.texture] = (updatedProfile.textures.loved[attributes.texture] || 0) + 1
      }
      if (attributes.brand) {
        updatedProfile.brands.loved[attributes.brand] = (updatedProfile.brands.loved[attributes.brand] || 0) + 1
      }
      updatedProfile.stats.totalLikes++
      break
      
    case 'WEAR':
      // User wore this outfit
      attributes.colors.forEach(color => {
        updatedProfile.colors.loved[color] = (updatedProfile.colors.loved[color] || 0) + 2 // Worth 2x
      })
      if (attributes.silhouette) {
        updatedProfile.silhouettes.loved[attributes.silhouette] = (updatedProfile.silhouettes.loved[attributes.silhouette] || 0) + 2
      }
      if (metadata.occasion) {
        updatedProfile.occasions.frequent[metadata.occasion] = (updatedProfile.occasions.frequent[metadata.occasion] || 0) + 1
      }
      updatedProfile.stats.totalWears++
      break
      
    case 'DELETE':
      // User deleted this item
      attributes.colors.forEach(color => {
        updatedProfile.colors.avoided[color] = (updatedProfile.colors.avoided[color] || 0) + 1
      })
      if (attributes.silhouette) {
        updatedProfile.silhouettes.avoided[attributes.silhouette] = (updatedProfile.silhouettes.avoided[attributes.silhouette] || 0) + 1
      }
      if (attributes.texture) {
        updatedProfile.textures.avoided[attributes.texture] = (updatedProfile.textures.avoided[attributes.texture] || 0) + 1
      }
      if (attributes.brand) {
        updatedProfile.brands.avoided[attributes.brand] = (updatedProfile.brands.avoided[attributes.brand] || 0) + 1
      }
      updatedProfile.stats.totalDeletes++
      break
      
    case 'UPLOAD':
      // User uploaded this item
      attributes.colors.forEach(color => {
        updatedProfile.colors.loved[color] = (updatedProfile.colors.loved[color] || 0) + 1
      })
      if (attributes.silhouette) {
        updatedProfile.silhouettes.loved[attributes.silhouette] = (updatedProfile.silhouettes.loved[attributes.silhouette] || 0) + 1
      }
      updatedProfile.stats.totalUploads++
      break
      
    case 'REJECT':
      // User rejected a suggestion
      attributes.colors.forEach(color => {
        updatedProfile.colors.avoided[color] = (updatedProfile.colors.avoided[color] || 0) + 1
      })
      if (attributes.silhouette) {
        updatedProfile.silhouettes.avoided[attributes.silhouette] = (updatedProfile.silhouettes.avoided[attributes.silhouette] || 0) + 1
      }
      updatedProfile.stats.totalRejects++
      break
  }
  
  // Update learning score (0-100)
  const totalActions = updatedProfile.stats.totalLikes + 
                      updatedProfile.stats.totalWears + 
                      updatedProfile.stats.totalDeletes + 
                      updatedProfile.stats.totalRejects + 
                      updatedProfile.stats.totalUploads
  
  updatedProfile.stats.learningScore = Math.min(100, totalActions * 2)
  updatedProfile.stats.lastActivity = new Date().toISOString()
  
  // Update timestamps
  updatedProfile.colors.lastUpdated = new Date().toISOString()
  updatedProfile.silhouettes.lastUpdated = new Date().toISOString()
  updatedProfile.textures.lastUpdated = new Date().toISOString()
  
  return updatedProfile
}

// ===== ANALYZE STYLE PROFILE =====
export const analyzeStyleProfile = (styleProfile) => {
  const insights = {
    topColors: [],
    avoidedColors: [],
    preferredSilhouette: null,
    avoidedSilhouette: null,
    favoriteOccasion: null,
    stylePattern: null,
    confidenceLevel: 0,
    recommendations: []
  }
  
  // Learning score determines confidence
  insights.confidenceLevel = styleProfile.stats.learningScore
  
  // Top 3 loved colors
  const lovedColors = Object.entries(styleProfile.colors.loved)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color)
  insights.topColors = lovedColors
  
  // Top 3 avoided colors
  const avoidedColors = Object.entries(styleProfile.colors.avoided)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color)
  insights.avoidedColors = avoidedColors
  
  // Preferred silhouette
  const silhouettes = Object.entries(styleProfile.silhouettes.loved)
    .sort((a, b) => b[1] - a[1])
  if (silhouettes.length > 0) {
    insights.preferredSilhouette = silhouettes[0][0]
  }
  
  // Avoided silhouette
  const avoidedSilhouettes = Object.entries(styleProfile.silhouettes.avoided)
    .sort((a, b) => b[1] - a[1])
  if (avoidedSilhouettes.length > 0) {
    insights.avoidedSilhouette = avoidedSilhouettes[0][0]
  }
  
  // Favorite occasion
  const occasions = Object.entries(styleProfile.occasions.frequent)
    .sort((a, b) => b[1] - a[1])
  if (occasions.length > 0) {
    insights.favoriteOccasion = occasions[0][0]
  }
  
  // Detect style pattern
  if (lovedColors.length >= 2) {
    if (lovedColors.includes('black') && lovedColors.includes('white')) {
      insights.stylePattern = 'monochrome'
    } else if (lovedColors.every(c => ['black', 'grey', 'white', 'navy', 'beige'].includes(c))) {
      insights.stylePattern = 'neutral'
    } else if (lovedColors.some(c => ['red', 'yellow', 'orange', 'pink', 'purple'].includes(c))) {
      insights.stylePattern = 'colorful'
    }
  }
  
  // Generate recommendations
  if (insights.confidenceLevel >= 20) {
    if (insights.topColors.length > 0) {
      insights.recommendations.push({
        type: 'color',
        message: `I've learned you love ${insights.topColors.join(', ')}. Want more outfits in these colors?`,
        action: 'generate_color_outfits',
        data: { colors: insights.topColors }
      })
    }
    
    if (insights.stylePattern === 'monochrome') {
      insights.recommendations.push({
        type: 'pattern',
        message: `You prefer monochrome outfits with minimal colors. Should I focus on black & white combinations?`,
        action: 'generate_monochrome',
        data: {}
      })
    }
    
    if (insights.preferredSilhouette) {
      insights.recommendations.push({
        type: 'silhouette',
        message: `I notice you prefer ${insights.preferredSilhouette} fits. Want suggestions that match?`,
        action: 'generate_silhouette',
        data: { silhouette: insights.preferredSilhouette }
      })
    }
  }
  
  return insights
}

// ===== GET INSIGHT MESSAGE =====
export const getInsightMessage = (styleProfile) => {
  const insights = analyzeStyleProfile(styleProfile)
  
  if (insights.confidenceLevel < 10) {
    return null // Not enough data yet
  }
  
  if (insights.confidenceLevel < 30) {
    return {
      title: "🌱 Learning Your Style...",
      message: `I'm starting to understand your preferences! Keep using the app and I'll get smarter.`,
      level: 'beginner'
    }
  }
  
  if (insights.confidenceLevel < 60) {
    let message = `I've learned that you `
    const facts = []
    
    if (insights.topColors.length > 0) {
      facts.push(`love ${insights.topColors.slice(0, 2).join(' and ')}`)
    }
    if (insights.preferredSilhouette) {
      facts.push(`prefer ${insights.preferredSilhouette} fits`)
    }
    if (insights.stylePattern) {
      facts.push(`have a ${insights.stylePattern} style`)
    }
    
    message += facts.join(', ') + '. '
    message += `Want me to generate outfits based on this?`
    
    return {
      title: "🧠 Style Profile Building!",
      message,
      level: 'intermediate',
      recommendations: insights.recommendations.slice(0, 2)
    }
  }
  
  // High confidence
  let message = `Your style DNA: `
  const dna = []
  
  if (insights.stylePattern) {
    dna.push(`${insights.stylePattern} palette`)
  }
  if (insights.topColors.length > 0) {
    dna.push(`loves ${insights.topColors.join(', ')}`)
  }
  if (insights.avoidedColors.length > 0) {
    dna.push(`avoids ${insights.avoidedColors.join(', ')}`)
  }
  if (insights.preferredSilhouette) {
    dna.push(`${insights.preferredSilhouette} silhouette`)
  }
  
  message += dna.join(' · ') + '. I know you well now! 🎯'
  
  return {
    title: "🎯 Style DNA Unlocked!",
    message,
    level: 'expert',
    recommendations: insights.recommendations
  }
}

// ===== SCORE ITEM MATCH =====
// Returns 0-100 score of how well item matches user's style
export const scoreItemMatch = (styleProfile, item) => {
  let score = 50 // Start neutral
  const attributes = extractStyleAttributes(item)
  
  // Check colors
  attributes.colors.forEach(color => {
    const lovedScore = styleProfile.colors.loved[color] || 0
    const avoidedScore = styleProfile.colors.avoided[color] || 0
    
    if (lovedScore > avoidedScore) {
      score += Math.min(lovedScore * 2, 20) // Max +20 per color
    } else if (avoidedScore > lovedScore) {
      score -= Math.min(avoidedScore * 2, 20) // Max -20 per color
    }
  })
  
  // Check silhouette
  if (attributes.silhouette) {
    const lovedScore = styleProfile.silhouettes.loved[attributes.silhouette] || 0
    const avoidedScore = styleProfile.silhouettes.avoided[attributes.silhouette] || 0
    
    if (lovedScore > avoidedScore) {
      score += Math.min(lovedScore * 3, 15)
    } else if (avoidedScore > lovedScore) {
      score -= Math.min(avoidedScore * 3, 15)
    }
  }
  
  // Check texture
  if (attributes.texture) {
    const lovedScore = styleProfile.textures.loved[attributes.texture] || 0
    const avoidedScore = styleProfile.textures.avoided[attributes.texture] || 0
    
    if (lovedScore > avoidedScore) {
      score += Math.min(lovedScore * 2, 10)
    } else if (avoidedScore > lovedScore) {
      score -= Math.min(avoidedScore * 2, 10)
    }
  }
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)))
}