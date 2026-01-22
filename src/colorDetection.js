// colorDetection.js
// Automatic color detection from uploaded clothing images
// Uses color-thief for dominant color extraction

/**
 * Extract dominant color from an image (base64)
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} - Hex color code (e.g., "#FF5733")
 */
export async function extractDominantColor(base64Image) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      
      img.onload = () => {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Simple color extraction (sample center pixels)
        const centerX = Math.floor(canvas.width / 2)
        const centerY = Math.floor(canvas.height / 2)
        const sampleSize = 50 // Sample 50x50 pixels from center
        
        let r = 0, g = 0, b = 0, count = 0
        
        for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
          for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
              const index = (y * canvas.width + x) * 4
              r += data[index]
              g += data[index + 1]
              b += data[index + 2]
              count++
            }
          }
        }
        
        // Average color
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        
        // Convert to hex
        const hex = '#' + [r, g, b].map(x => {
          const hex = x.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        }).join('')
        
        resolve(hex)
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = base64Image
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Convert hex color to nearest color name
 * @param {string} hex - Hex color code
 * @returns {string} - Color name (e.g., "red", "blue")
 */
export function getColorName(hex) {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Define basic colors with RGB ranges
  const colors = [
    { name: 'black', r: [0, 50], g: [0, 50], b: [0, 50] },
    { name: 'white', r: [200, 255], g: [200, 255], b: [200, 255] },
    { name: 'gray', r: [50, 200], g: [50, 200], b: [50, 200], condition: 'similar' },
    { name: 'red', r: [150, 255], g: [0, 100], b: [0, 100] },
    { name: 'orange', r: [200, 255], g: [100, 200], b: [0, 100] },
    { name: 'yellow', r: [200, 255], g: [200, 255], b: [0, 150] },
    { name: 'green', r: [0, 150], g: [150, 255], b: [0, 150] },
    { name: 'blue', r: [0, 150], g: [0, 150], b: [150, 255] },
    { name: 'purple', r: [100, 200], g: [0, 100], b: [150, 255] },
    { name: 'pink', r: [200, 255], g: [100, 200], b: [150, 255] },
    { name: 'brown', r: [100, 180], g: [50, 120], b: [20, 80] },
    { name: 'beige', r: [200, 255], g: [180, 220], b: [140, 200] },
    { name: 'navy', r: [0, 50], g: [0, 50], b: [100, 150] },
    { name: 'teal', r: [0, 100], g: [150, 200], b: [150, 200] }
  ]
  
  // Check for gray (when RGB values are similar)
  const rgbDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
  if (rgbDiff < 30) {
    if (r < 50) return 'black'
    if (r > 200) return 'white'
    return 'gray'
  }
  
  // Find closest color match
  for (const color of colors) {
    if (color.condition === 'similar') continue // Already handled gray
    
    if (r >= color.r[0] && r <= color.r[1] &&
        g >= color.g[0] && g <= color.g[1] &&
        b >= color.b[0] && b <= color.b[1]) {
      return color.name
    }
  }
  
  // Fallback: determine by dominant channel
  if (r > g && r > b) return 'red'
  if (g > r && g > b) return 'green'
  if (b > r && b > g) return 'blue'
  
  return 'multicolor'
}

/**
 * Check if two colors complement each other (color theory)
 * @param {string} color1 - First color name
 * @param {string} color2 - Second color name
 * @returns {boolean} - True if colors complement
 */
export function doColorsMatch(color1, color2) {
  const complementary = {
    'red': ['green', 'white', 'black', 'gray', 'beige'],
    'blue': ['orange', 'white', 'black', 'gray', 'beige', 'yellow'],
    'yellow': ['purple', 'blue', 'gray', 'navy'],
    'green': ['red', 'beige', 'brown', 'white', 'black'],
    'purple': ['yellow', 'green', 'white', 'gray'],
    'orange': ['blue', 'navy', 'white', 'black', 'teal'],
    'pink': ['gray', 'navy', 'white', 'black', 'green'],
    'brown': ['beige', 'white', 'green', 'blue'],
    'navy': ['white', 'beige', 'orange', 'pink'],
    'black': ['white', 'red', 'blue', 'pink', 'green'],
    'white': ['black', 'red', 'blue', 'navy', 'purple'],
    'gray': ['white', 'black', 'blue', 'pink', 'yellow'],
    'beige': ['brown', 'navy', 'white', 'green']
  }
  
  // Neutrals match with everything
  const neutrals = ['white', 'black', 'gray', 'beige']
  if (neutrals.includes(color1) || neutrals.includes(color2)) {
    return true
  }
  
  // Check complementary colors
  return complementary[color1]?.includes(color2) || false
}

/**
 * Get color recommendations for an outfit
 * @param {string} baseColor - Base color of the outfit
 * @returns {string[]} - Array of recommended colors
 */
export function getColorRecommendations(baseColor) {
  const recommendations = {
    'red': ['white', 'black', 'navy', 'gray', 'beige'],
    'blue': ['white', 'beige', 'gray', 'brown', 'pink'],
    'yellow': ['navy', 'gray', 'white', 'purple'],
    'green': ['beige', 'brown', 'white', 'navy'],
    'purple': ['white', 'gray', 'yellow', 'black'],
    'orange': ['navy', 'teal', 'white', 'brown'],
    'pink': ['navy', 'gray', 'white', 'green'],
    'brown': ['beige', 'white', 'blue', 'green'],
    'navy': ['white', 'beige', 'pink', 'red'],
    'black': ['white', 'red', 'pink', 'blue'],
    'white': ['navy', 'red', 'blue', 'black'],
    'gray': ['pink', 'blue', 'yellow', 'white'],
    'beige': ['navy', 'brown', 'white', 'green']
  }
  
  return recommendations[baseColor] || ['white', 'black', 'gray']
}

/**
 * Analyze color palette of entire wardrobe
 * @param {Array} items - Array of wardrobe items with colors
 * @returns {Object} - Color analysis
 */
export function analyzeColorPalette(items) {
  const colorCounts = {}
  
  items.forEach(item => {
    if (item.color && item.color !== 'unspecified') {
      colorCounts[item.color] = (colorCounts[item.color] || 0) + 1
    }
  })
  
  // Sort by frequency
  const sorted = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([color, count]) => ({ color, count, percentage: (count / items.length * 100).toFixed(1) }))
  
  return {
    dominantColor: sorted[0]?.color || 'none',
    colorDistribution: sorted,
    totalColors: Object.keys(colorCounts).length,
    missingColors: ['red', 'blue', 'green', 'yellow', 'white', 'black', 'gray']
      .filter(c => !colorCounts[c])
  }
}

// USAGE EXAMPLE:
/*
import { extractDominantColor, getColorName, doColorsMatch } from './colorDetection'

// When uploading image:
const handleUpload = async (file) => {
  const base64 = await convertToBase64(file)
  const dominantColor = await extractDominantColor(base64)
  const colorName = getColorName(dominantColor)
  
  console.log(`Detected color: ${colorName} (${dominantColor})`)
  
  // Save to database
  await supabase.from('wardrobe_items').insert({
    color: colorName,
    color_hex: dominantColor,
    // ... other fields
  })
}

// When generating outfits:
const top = { color: 'red' }
const bottom = { color: 'blue' }

if (doColorsMatch(top.color, bottom.color)) {
  console.log('These colors work well together!')
}
*/