// keepAlive.js - Keep Render service warm to prevent cold starts
// Add this to your src/ folder

/**
 * PROBLEM: Render spins down services after 15 minutes of inactivity
 * SOLUTION: Ping the API every 10 minutes to keep it alive
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://outfitrater.xyz' // Replace with your API URL
const PING_INTERVAL = 10 * 60 * 1000 // 10 minutes (before Render's 15min timeout)

let pingInterval = null

// Start pinging
export const startKeepAlive = () => {
  // Don't ping if already running
  if (pingInterval) return
  
  console.log('🏓 Starting keep-alive pings...')
  
  // Ping immediately
  pingAPI()
  
  // Then ping every 10 minutes
  pingInterval = setInterval(() => {
    pingAPI()
  }, PING_INTERVAL)
}

// Stop pinging
export const stopKeepAlive = () => {
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
    console.log('🛑 Stopped keep-alive pings')
  }
}

// Ping the API
const pingAPI = async () => {
  try {
    const response = await fetch(`${API_URL}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Keep-alive ping successful:', data.timestamp)
    } else {
      console.warn('⚠️ Keep-alive ping failed:', response.status)
    }
  } catch (error) {
    console.error('❌ Keep-alive ping error:', error.message)
  }
}

// Auto-start on import (optional)
if (typeof window !== 'undefined') {
  // Start when user becomes active
  window.addEventListener('focus', startKeepAlive)
  
  // Stop when user leaves (save resources)
  window.addEventListener('blur', () => {
    // Don't stop, keep pinging even when tab is inactive
    // This ensures API stays warm
  })
  
  // Start immediately
  startKeepAlive()
}