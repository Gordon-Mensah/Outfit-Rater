// weatherIntegration.js
// All Open-Meteo calls are routed through the Supabase Edge Function
// to avoid Content Security Policy blocks on the client.

import { supabase } from './supabaseClient'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const WMO_CODE_MAP = {
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
  80: 'Light Rain',
  81: 'Rain',
  82: 'Heavy Rain',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
}

function wmoToCondition(code) {
  return WMO_CODE_MAP[code] || 'Clear'
}

// Call the Supabase Edge Function proxy
async function callWeatherProxy(latitude, longitude, type = 'current') {
  const { data, error } = await supabase.functions.invoke('weather-proxy', {
    body: { latitude, longitude, type }
  })

  if (error) throw new Error(error.message)
  return data
}

// Get the user's coordinates via browser geolocation
function getCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err)
    )
  })
}

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────

/**
 * Fetch current weather for a given lat/lon.
 * Returns { temp, condition } or null on failure.
 */
export async function fetchWeather(latitude, longitude) {
  try {
    const data = await callWeatherProxy(latitude, longitude, 'current')
    const temp = Math.round(data.current_weather?.temperature ?? 22)
    const condition = wmoToCondition(data.current_weather?.weathercode ?? 0)
    return { temp, condition }
  } catch (err) {
    console.error('Weather fetch error:', err)
    return null
  }
}

/**
 * Fetch today + tomorrow weather using the browser's geolocation.
 * Returns { weather: { today, tomorrow } } or throws.
 */
export async function getUserWeatherTwoDays() {
  const { latitude, longitude } = await getCoords()
  const data = await callWeatherProxy(latitude, longitude, 'two-day')

  const currentCode = data.current_weather?.weathercode ?? 0
  const todayMaxCode = data.daily?.weathercode?.[0] ?? currentCode
  const tomorrowMaxCode = data.daily?.weathercode?.[1] ?? currentCode

  const today = {
    temp: Math.round(data.current_weather?.temperature ?? 22),
    condition: wmoToCondition(currentCode),
    high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 22),
    low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 15),
  }

  const tomorrow = {
    temp: Math.round(data.daily?.temperature_2m_max?.[1] ?? 22),
    condition: wmoToCondition(tomorrowMaxCode),
    high: Math.round(data.daily?.temperature_2m_max?.[1] ?? 22),
    low: Math.round(data.daily?.temperature_2m_min?.[1] ?? 15),
  }

  return { weather: { today, tomorrow } }
}

/**
 * Generate basic outfit suggestions for today and tomorrow
 * based on temperature and condition.
 */
export function getTodayTomorrowOutfits(wardrobe, today, tomorrow) {
  function suggestForDay(dayWeather) {
    const { tops = [], bottoms = [], shoes = [], outerwear = [], accessories = [] } = wardrobe

    const needsOuterwear = dayWeather.temp < 15
    const needsRainwear = ['Rain', 'Heavy Rain', 'Drizzle', 'Light Drizzle', 'Heavy Drizzle', 'Thunderstorm'].includes(dayWeather.condition)

    // Pick a random item from array or null
    const pick = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null

    // For rain/cold, prefer outerwear
    let chosenOuterwear = null
    if (needsOuterwear || needsRainwear) {
      chosenOuterwear = pick(outerwear)
    }

    return {
      top: pick(tops),
      bottom: pick(bottoms),
      shoes: pick(shoes),
      outerwear: chosenOuterwear,
      accessory: pick(accessories),
      weather: dayWeather,
    }
  }

  return {
    today: today ? suggestForDay(today) : null,
    tomorrow: tomorrow ? suggestForDay(tomorrow) : null,
  }
}