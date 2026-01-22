// weatherIntegration.js
// Weather-based outfit suggestions using OpenWeatherMap API

/**
 * Get weather-appropriate outfit suggestions
 * @param {Object} wardrobe - User's wardrobe organized by category
 * @param {Object} weather - Current weather data
 * @returns {Array} - Array of weather-appropriate outfits
 */
export function getWeatherSuggestions(wardrobe, weather) {
  const { temp, condition } = weather
  const suggestions = []

  // Temperature-based logic
  if (temp < 10) {
    // Cold weather (< 10°C)
    suggestions.push(...getColdWeatherOutfits(wardrobe, condition))
  } else if (temp >= 10 && temp < 20) {
    // Mild weather (10-20°C)
    suggestions.push(...getMildWeatherOutfits(wardrobe, condition))
  } else if (temp >= 20 && temp < 30) {
    // Warm weather (20-30°C)
    suggestions.push(...getWarmWeatherOutfits(wardrobe, condition))
  } else {
    // Hot weather (30°C+)
    suggestions.push(...getHotWeatherOutfits(wardrobe, condition))
  }

  return suggestions.slice(0, 5) // Return top 5 suggestions
}

/**
 * Cold weather outfits (< 10°C)
 */
function getColdWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, outerwear, accessories } = wardrobe
  const outfits = []

  // Prioritize warm items
  const warmTops = tops.filter(t => 
    t.name.toLowerCase().includes('sweater') || 
    t.name.toLowerCase().includes('hoodie') ||
    t.name.toLowerCase().includes('fleece')
  )

  const warmOuterwear = outerwear.filter(o => 
    o.name.toLowerCase().includes('coat') || 
    o.name.toLowerCase().includes('jacket') ||
    o.name.toLowerCase().includes('parka')
  )

  // Create layered outfits
  for (let i = 0; i < Math.min(3, warmTops.length || tops.length); i++) {
    const top = warmTops[i] || tops[i]
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)]
    const shoe = shoes[Math.floor(Math.random() * shoes.length)]
    const jacket = warmOuterwear[Math.floor(Math.random() * warmOuterwear.length)] || 
                   outerwear[Math.floor(Math.random() * outerwear.length)]

    if (top && bottom && shoe) {
      outfits.push({
        id: `cold-outfit-${i}`,
        occasion: 'cold weather',
        top,
        bottom,
        shoes: shoe,
        outerwear: jacket,
        accessory: accessories[Math.floor(Math.random() * accessories.length)],
        weatherTip: condition === 'Rain' || condition === 'Snow' 
          ? '🌧️ Don\'t forget an umbrella!' 
          : '🧣 Layer up! It\'s cold outside.',
        temperature: '< 10°C',
        reasoning: 'Warm layers recommended for cold weather'
      })
    }
  }

  return outfits
}

/**
 * Mild weather outfits (10-20°C)
 */
function getMildWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, outerwear, accessories } = wardrobe
  const outfits = []

  // Light layers
  const lightTops = tops.filter(t => 
    !t.name.toLowerCase().includes('tank') &&
    !t.name.toLowerCase().includes('heavy')
  )

  const lightJackets = outerwear.filter(o => 
    o.name.toLowerCase().includes('light') || 
    o.name.toLowerCase().includes('cardigan') ||
    o.name.toLowerCase().includes('blazer')
  )

  for (let i = 0; i < Math.min(3, lightTops.length || tops.length); i++) {
    const top = lightTops[i] || tops[i]
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)]
    const shoe = shoes[Math.floor(Math.random() * shoes.length)]
    const jacket = lightJackets[Math.floor(Math.random() * lightJackets.length)]

    if (top && bottom && shoe) {
      outfits.push({
        id: `mild-outfit-${i}`,
        occasion: 'mild weather',
        top,
        bottom,
        shoes: shoe,
        outerwear: jacket || null,
        accessory: accessories[Math.floor(Math.random() * accessories.length)],
        weatherTip: condition === 'Rain' 
          ? '☔ Light rain possible - bring a jacket!' 
          : '🌤️ Perfect weather! Layer as needed.',
        temperature: '10-20°C',
        reasoning: 'Light layers for comfortable mild weather'
      })
    }
  }

  return outfits
}

/**
 * Warm weather outfits (20-30°C)
 */
function getWarmWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, accessories } = wardrobe
  const outfits = []

  // Light, breathable items
  const lightTops = tops.filter(t => 
    t.name.toLowerCase().includes('t-shirt') || 
    t.name.toLowerCase().includes('tank') ||
    t.name.toLowerCase().includes('light') ||
    t.name.toLowerCase().includes('polo')
  )

  const lightBottoms = bottoms.filter(b => 
    b.name.toLowerCase().includes('shorts') || 
    b.name.toLowerCase().includes('skirt') ||
    b.name.toLowerCase().includes('light')
  )

  for (let i = 0; i < Math.min(3, lightTops.length || tops.length); i++) {
    const top = lightTops[i] || tops[i]
    const bottom = lightBottoms[Math.floor(Math.random() * lightBottoms.length)] || 
                   bottoms[Math.floor(Math.random() * bottoms.length)]
    const shoe = shoes[Math.floor(Math.random() * shoes.length)]

    if (top && bottom && shoe) {
      outfits.push({
        id: `warm-outfit-${i}`,
        occasion: 'warm weather',
        top,
        bottom,
        shoes: shoe,
        outerwear: null,
        accessory: accessories[Math.floor(Math.random() * accessories.length)],
        weatherTip: condition === 'Clear' 
          ? '😎 Don\'t forget sunscreen!' 
          : '🌞 Stay cool and hydrated!',
        temperature: '20-30°C',
        reasoning: 'Light, breathable clothes for warm weather'
      })
    }
  }

  return outfits
}

/**
 * Hot weather outfits (30°C+)
 */
function getHotWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, accessories } = wardrobe
  const outfits = []

  // Minimal, breathable clothing
  const coolTops = tops.filter(t => 
    t.name.toLowerCase().includes('tank') || 
    t.name.toLowerCase().includes('sleeveless') ||
    t.name.toLowerCase().includes('light')
  )

  const coolBottoms = bottoms.filter(b => 
    b.name.toLowerCase().includes('shorts') || 
    b.name.toLowerCase().includes('light skirt')
  )

  for (let i = 0; i < Math.min(3, coolTops.length || tops.length); i++) {
    const top = coolTops[i] || tops[i]
    const bottom = coolBottoms[Math.floor(Math.random() * coolBottoms.length)] || 
                   bottoms[Math.floor(Math.random() * bottoms.length)]
    const shoe = shoes[Math.floor(Math.random() * shoes.length)]

    if (top && bottom && shoe) {
      outfits.push({
        id: `hot-outfit-${i}`,
        occasion: 'hot weather',
        top,
        bottom,
        shoes: shoe,
        outerwear: null,
        accessory: accessories[Math.floor(Math.random() * accessories.length)],
        weatherTip: '🔥 It\'s hot! Wear light colors and stay hydrated!',
        temperature: '30°C+',
        reasoning: 'Minimal, breathable clothing for extreme heat'
      })
    }
  }

  return outfits
}

/**
 * Get weather icon recommendation
 * @param {string} condition - Weather condition
 * @returns {string} - Icon emoji
 */
export function getWeatherIcon(condition) {
  const icons = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️'
  }
  
  return icons[condition] || '🌤️'
}

/**
 * Get clothing recommendations based on weather
 * @param {number} temp - Temperature in Celsius
 * @param {string} condition - Weather condition
 * @returns {Object} - Clothing recommendations
 */
export function getWeatherRecommendations(temp, condition) {
  const recommendations = {
    layers: [],
    fabrics: [],
    colors: [],
    accessories: []
  }

  // Temperature-based recommendations
  if (temp < 10) {
    recommendations.layers = ['Base layer', 'Sweater/Hoodie', 'Heavy jacket']
    recommendations.fabrics = ['Wool', 'Fleece', 'Down']
    recommendations.colors = ['Dark colors (retain heat)']
    recommendations.accessories = ['Scarf', 'Gloves', 'Beanie']
  } else if (temp < 20) {
    recommendations.layers = ['Light top', 'Light jacket/cardigan']
    recommendations.fabrics = ['Cotton', 'Light wool']
    recommendations.colors = ['Any colors']
    recommendations.accessories = ['Light scarf (optional)']
  } else if (temp < 30) {
    recommendations.layers = ['Single layer (t-shirt/polo)']
    recommendations.fabrics = ['Cotton', 'Linen']
    recommendations.colors = ['Light colors preferred']
    recommendations.accessories = ['Sunglasses', 'Hat']
  } else {
    recommendations.layers = ['Minimal (tank top/sleeveless)']
    recommendations.fabrics = ['Breathable cotton', 'Moisture-wicking']
    recommendations.colors = ['Light colors (reflect heat)']
    recommendations.accessories = ['Sunglasses', 'Hat', 'Sunscreen!']
  }

  // Condition-based additions
  if (condition === 'Rain' || condition === 'Drizzle') {
    recommendations.accessories.push('Umbrella', 'Waterproof jacket')
  } else if (condition === 'Snow') {
    recommendations.accessories.push('Waterproof boots', 'Warm socks')
  } else if (condition === 'Thunderstorm') {
    recommendations.accessories.push('Avoid metal accessories')
  }

  return recommendations
}

/**
 * Fetch current weather for user's location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Weather data
 */
export async function fetchWeather(lat, lon) {
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
  
  if (!API_KEY || API_KEY === 'demo') {
    console.warn('No OpenWeatherMap API key found. Using demo data.')
    return {
      temp: 20,
      condition: 'Clear',
      description: 'clear sky',
      icon: '01d'
    }
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    )
    
    if (!response.ok) throw new Error('Weather API failed')
    
    const data = await response.json()
    
    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed
    }
  } catch (error) {
    console.error('Weather fetch error:', error)
    return null
  }
}

/**
 * Get user's location and weather
 * @returns {Promise<Object>} - Location and weather data
 */
export async function getUserWeather() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const weather = await fetchWeather(latitude, longitude)
        
        resolve({
          location: { lat: latitude, lon: longitude },
          weather
        })
      },
      (error) => {
        reject(error)
      }
    )
  })
}

// SETUP INSTRUCTIONS:
/*
1. Get a FREE API key from OpenWeatherMap:
   - Go to: https://openweathermap.org/api
   - Sign up for a free account
   - Get your API key from the dashboard

2. Add to your .env file:
   VITE_OPENWEATHER_API_KEY=your_api_key_here

3. Usage in VirtualWardrobe.jsx:
   
   import { getUserWeather, getWeatherSuggestions } from './weatherIntegration'

   useEffect(() => {
     loadWeather()
   }, [])

   const loadWeather = async () => {
     try {
       const { weather } = await getUserWeather()
       setWeather(weather)
     } catch (error) {
       console.error('Weather error:', error)
     }
   }

   const generateWeatherOutfits = async () => {
     const outfits = getWeatherSuggestions(wardrobe, weather)
     setGeneratedOutfits(outfits)
   }
*/

// USAGE EXAMPLE:
/*
import { getUserWeather, getWeatherRecommendations, getWeatherIcon } from './weatherIntegration'

// Get current weather
const { weather } = await getUserWeather()
console.log(`${weather.temp}°C, ${weather.condition}`)

// Get recommendations
const recs = getWeatherRecommendations(weather.temp, weather.condition)
console.log('Recommended layers:', recs.layers)
console.log('Recommended fabrics:', recs.fabrics)
console.log('Suggested accessories:', recs.accessories)

// Display weather icon
const icon = getWeatherIcon(weather.condition)
console.log(`Weather: ${icon} ${weather.temp}°C`)
*/