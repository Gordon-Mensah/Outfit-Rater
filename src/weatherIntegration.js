// weatherIntegration.js
// Weather-based outfit suggestions using Open-Meteo API (no API key, highly accurate)

/* ---------------------------------------------------
   OUTFIT SUGGESTIONS (MAIN ENTRY)
---------------------------------------------------- */

export function getWeatherSuggestions(wardrobe, weather) {
  const { temp, condition } = weather
  const suggestions = []

  if (temp < 10) {
    suggestions.push(...getColdWeatherOutfits(wardrobe, condition))
  } else if (temp < 20) {
    suggestions.push(...getMildWeatherOutfits(wardrobe, condition))
  } else if (temp < 30) {
    suggestions.push(...getWarmWeatherOutfits(wardrobe, condition))
  } else {
    suggestions.push(...getHotWeatherOutfits(wardrobe, condition))
  }

  return suggestions.slice(0, 5)
}

/* ---------------------------------------------------
   OUTFIT LOGIC FOR EACH TEMPERATURE RANGE
---------------------------------------------------- */

function getColdWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, outerwear, accessories } = wardrobe
  const outfits = []

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

  for (let i = 0; i < Math.min(3, warmTops.length || tops.length); i++) {
    const top = warmTops[i] || tops[i]
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)]
    const shoe = shoes[Math.floor(Math.random() * shoes.length)]
    const jacket = warmOuterwear[Math.floor(Math.random() * warmOuterwear.length)] ||
                   outerwear[Math.floor(Math.random() * outerwear.length)]

    outfits.push({
      id: `cold-${i}`,
      occasion: 'Cold Weather',
      top,
      bottom,
      shoes: shoe,
      outerwear: jacket,
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      weatherTip: condition.includes('rain') ? '🌧️ Bring an umbrella!' : '🧣 Layer up!',
      temperature: '< 10°C'
    })
  }

  return outfits
}

function getMildWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, outerwear, accessories } = wardrobe
  const outfits = []

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

    outfits.push({
      id: `mild-${i}`,
      occasion: 'Mild Weather',
      top,
      bottom,
      shoes: shoe,
      outerwear: jacket || null,
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      weatherTip: condition.includes('rain') ? '☔ Light rain possible' : '🌤️ Perfect weather',
      temperature: '10-20°C'
    })
  }

  return outfits
}

function getWarmWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, accessories } = wardrobe
  const outfits = []

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

    outfits.push({
      id: `warm-${i}`,
      occasion: 'Warm Weather',
      top,
      bottom,
      shoes: shoe,
      outerwear: null,
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      weatherTip: condition.includes('clear') ? '😎 Wear sunscreen' : '🌞 Stay cool',
      temperature: '20-30°C'
    })
  }

  return outfits
}

function getHotWeatherOutfits(wardrobe, condition) {
  const { tops, bottoms, shoes, accessories } = wardrobe
  const outfits = []

  const coolTops = tops.filter(t =>
    t.name.toLowerCase().includes('tank') ||
    t.name.toLowerCase().includes('sleeveless') ||
    t.name.toLowerCase().includes('light')
  )

  const coolBottoms = bottoms.filter(b =>
    b.name.toLowerCase().includes('shorts') ||
    b.name.toLowerCase().includes('skirt')
  )

  for (let i = 0; i < Math.min(3, coolTops.length || tops.length); i++) {
    const top = coolTops[i] || tops[i]
    const bottom = coolBottoms[Math.floor(Math.random() * coolBottoms.length)] ||
                   bottoms[Math.floor(Math.random() * bottoms.length)]
    const shoe = shoes[Math.floor(Math.random() * shoes.length)]

    outfits.push({
      id: `hot-${i}`,
      occasion: 'Hot Weather',
      top,
      bottom,
      shoes: shoe,
      outerwear: null,
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      weatherTip: '🔥 Stay hydrated!',
      temperature: '30°C+'
    })
  }

  return outfits
}

/* ---------------------------------------------------
   WEATHER ICONS
---------------------------------------------------- */

export function getWeatherIcon(code) {
  const icons = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌦️',
    53: '🌦️',
    55: '🌦️',
    61: '🌧️',
    63: '🌧️',
    65: '🌧️',
    71: '❄️',
    73: '❄️',
    75: '❄️',
    95: '⛈️',
    96: '⛈️',
    99: '⛈️'
  }

  return icons[code] || '🌤️'
}

/* ---------------------------------------------------
   WEATHER RECOMMENDATIONS
---------------------------------------------------- */

export function getWeatherRecommendations(temp, condition) {
  const rec = {
    layers: [],
    fabrics: [],
    colors: [],
    accessories: []
  }

  if (temp < 10) {
    rec.layers = ['Sweater', 'Hoodie', 'Heavy Jacket']
    rec.fabrics = ['Wool', 'Fleece']
    rec.colors = ['Dark colors']
    rec.accessories = ['Scarf', 'Gloves']
  } else if (temp < 20) {
    rec.layers = ['Light Jacket']
    rec.fabrics = ['Cotton']
    rec.colors = ['Any']
    rec.accessories = ['Light scarf']
  } else if (temp < 30) {
    rec.layers = ['T-shirt']
    rec.fabrics = ['Cotton', 'Linen']
    rec.colors = ['Light colors']
    rec.accessories = ['Sunglasses']
  } else {
    rec.layers = ['Tank top']
    rec.fabrics = ['Breathable fabrics']
    rec.colors = ['White / light colors']
    rec.accessories = ['Hat', 'Sunscreen']
  }

  if (condition.includes('rain')) {
    rec.accessories.push('Umbrella')
  }

  return rec
}

/* ---------------------------------------------------
   FETCH WEATHER (Open-Meteo)
---------------------------------------------------- */

export async function fetchWeather(lat, lon) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
    )

    const data = await response.json()

    return {
      temp: Math.round(data.current_weather.temperature),
      condition: mapWeatherCodeToText(data.current_weather.weathercode),
      description: mapWeatherCodeToText(data.current_weather.weathercode),
      icon: data.current_weather.weathercode,
      windSpeed: data.current_weather.windspeed
    }
  } catch (err) {
    console.error('Weather fetch error:', err)
    return null
  }
}

/* ---------------------------------------------------
   TODAY + TOMORROW WEATHER
---------------------------------------------------- */

export async function fetchTodayAndTomorrow(lat, lon) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    )

    const data = await response.json()

    return {
      today: {
        temp: Math.round(data.current_weather.temperature),
        condition: mapWeatherCodeToText(data.current_weather.weathercode),
        icon: data.current_weather.weathercode
      },
      tomorrow: {
        temp: Math.round((data.daily.temperature_2m_max[1] + data.daily.temperature_2m_min[1]) / 2),
        condition: mapWeatherCodeToText(data.daily.weathercode[1]),
        icon: data.daily.weathercode[1]
      }
    }
  } catch (err) {
    console.error("Two-day weather error:", err)
    return null
  }
}

/* ---------------------------------------------------
   TODAY vs TOMORROW OUTFITS
---------------------------------------------------- */

export function getTodayTomorrowOutfits(wardrobe, todayWeather, tomorrowWeather) {
  return {
    today: getWeatherSuggestions(wardrobe, todayWeather),
    tomorrow: getWeatherSuggestions(wardrobe, tomorrowWeather)
  }
}

/* ---------------------------------------------------
   WEATHER CODE → TEXT
---------------------------------------------------- */

function mapWeatherCodeToText(code) {
  const map = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Cloudy',
    45: 'Fog',
    48: 'Fog',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Snow',
    73: 'Snow',
    75: 'Snow',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm'
  }

  return map[code] || 'Unknown'
}

/* ---------------------------------------------------
   GET USER WEATHER (CURRENT)
---------------------------------------------------- */

export async function getUserWeather() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const weather = await fetchWeather(latitude, longitude)

        resolve({
          location: { lat: latitude, lon: longitude },
          weather
        })
      },
      (err) => reject(err)
    )
  })
}

/* ---------------------------------------------------
   GET USER WEATHER (TODAY + TOMORROW)
---------------------------------------------------- */

export async function getUserWeatherTwoDays() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const weather = await fetchTodayAndTomorrow(latitude, longitude)

        resolve({
          location: { lat: latitude, lon: longitude },
          weather
        })
      },
      (err) => reject(err)
    )
  })
}
