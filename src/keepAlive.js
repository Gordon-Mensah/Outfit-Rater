// keepAlive.js - Enhanced with instant refresh on return
/**
 * PROBLEM: Render spins down services after 15 minutes of inactivity
 * SOLUTION: 
 * 1. Ping API every 10 minutes to keep it alive
 * 2. Instantly refresh when user returns to tab
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://outfit-rater.onrender.com'
const PING_INTERVAL = 10 * 60 * 1000 // 10 minutes (before Render's 15min timeout)

let pingInterval = null
let lastPingTime = Date.now()

// Start pinging
export const startKeepAlive = () => {
  // Don't ping if already running
  if (pingInterval) {
    console.log('⚠️ Keep-alive already running')
    return
  }
  
  console.log('🏓 Starting keep-alive pings...')
  console.log(`📡 Pinging ${API_URL}/api/ping every 10 minutes`)
  
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
      lastPingTime = Date.now()
      console.log('✅ Keep-alive ping successful:', data.timestamp)
    } else {
      console.warn('⚠️ Keep-alive ping failed:', response.status)
    }
  } catch (error) {
    console.error('❌ Keep-alive ping error:', error.message)
    // Don't throw - we want the interval to keep trying
  }
}

// ⭐ NEW: Instant refresh when user returns
if (typeof window !== 'undefined') {
  // When user returns to tab, immediately ping if it's been a while
  window.addEventListener('focus', () => {
    console.log('👀 User returned to tab!')
    
    const timeSinceLastPing = Date.now() - lastPingTime
    const fiveMinutes = 5 * 60 * 1000
    
    // If it's been more than 5 minutes, ping immediately
    if (timeSinceLastPing > fiveMinutes) {
      console.log('🚀 Instant refresh triggered!')
      pingAPI()
    }
    
    // Make sure keep-alive is running
    startKeepAlive()
  })
  
  // Keep pinging even when tab is blurred
  window.addEventListener('blur', () => {
    console.log('👋 Tab blurred - keep-alive still running')
    // Don't stop! Keep pinging to ensure instant response when user returns
  })
  
  // Start immediately on load
  startKeepAlive()
  
  // ⭐ NEW: Also refresh on visibility change (handles mobile better)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('📱 App became visible!')
      
      const timeSinceLastPing = Date.now() - lastPingTime
      const fiveMinutes = 5 * 60 * 1000
      
      if (timeSinceLastPing > fiveMinutes) {
        console.log('🚀 Instant refresh triggered (visibility)!')
        pingAPI()
      }
    }
  })
}