// keepAlive.js - IMPROVED: Better timeout handling and instant session recovery
// FIXES: "Session check timeout" error when returning to tab

const API_URL = import.meta.env.VITE_API_URL || 'https://outfitrater.xyz'
const PING_INTERVAL = 10 * 60 * 1000 // 10 minutes
const SESSION_CHECK_TIMEOUT = 3000 // 3 seconds max wait for session check

let pingInterval = null
let isRunning = false

// Import supabase directly
import { supabase } from './supabaseClient'

// Start pinging
export const startKeepAlive = () => {
  if (isRunning) {
    console.log('⚠️ Keep-alive already running')
    return
  }
  
  isRunning = true
  console.log('🏓 Starting keep-alive pings...')
  console.log('📡 Pinging', API_URL + '/api/ping', 'every 10 minutes')
  
  // Ping immediately
  pingAPI()
  
  // Then ping every 10 minutes
  pingInterval = setInterval(() => {
    pingAPI()
  }, PING_INTERVAL)
  
  // ⭐ NEW: Set up visibility change handlers
  setupVisibilityHandlers()
}

// Stop pinging
export const stopKeepAlive = () => {
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
    isRunning = false
    console.log('🛑 Stopped keep-alive pings')
  }
}

// Ping the API
const pingAPI = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
    
    const response = await fetch(`${API_URL}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Keep-alive ping successful:', data.timestamp)
    } else {
      console.warn('⚠️ Keep-alive ping failed:', response.status)
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('⚠️ Keep-alive ping timeout (API may be sleeping)')
    } else {
      console.error('❌ Keep-alive ping error:', error.message)
    }
  }
}

// ⭐ NEW: Setup visibility handlers for instant recovery
const setupVisibilityHandlers = () => {
  // Handle page visibility change
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('📱 App became visible!')
      await handleTabFocus()
    } else {
      console.log('👋 Tab blurred - keep-alive still running')
    }
  })
  
  // Handle window focus
  window.addEventListener('focus', async () => {
    console.log('👀 User returned to tab!')
    await handleTabFocus()
  })
}

// ⭐ NEW: Handle tab focus with aggressive session refresh
const handleTabFocus = async () => {
  try {
    console.log('👀 Window focused - checking session instantly...')
    
    // ⭐ CRITICAL FIX: Use Promise.race to timeout the session check
    const sessionCheckPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), SESSION_CHECK_TIMEOUT)
    )
    
    const { data: { session }, error } = await Promise.race([
      sessionCheckPromise,
      timeoutPromise
    ])
    
    if (error) {
      console.error('❌ Session check failed:', error)
      // Force refresh session
      console.log('🔄 Force refreshing session...')
      await supabase.auth.refreshSession()
      return
    }
    
    if (!session) {
      console.log('⚠️ No session found - may need to re-login')
      // Try to refresh one more time
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !newSession) {
        console.log('❌ Session refresh failed - redirecting to login')
        // Only redirect if we're not already on login/signup
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          window.location.href = '/login'
        }
      } else {
        console.log('✅ Session recovered!')
      }
    } else {
      // Check if token is close to expiry
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)
      const minutesUntilExpiry = (expiresAt - now) / 60
      
      if (minutesUntilExpiry < 5) {
        console.log('⚠️ Token expiring soon, refreshing...')
        await supabase.auth.refreshSession()
      } else {
        console.log('✅ Session valid, expires in', Math.floor(minutesUntilExpiry), 'minutes')
      }
    }
  } catch (error) {
    console.error('❌ Focus check error:', error.message)
    // If session check times out, force refresh anyway
    if (error.message === 'Session check timeout') {
      console.log('⚡ Session check timed out - force refreshing...')
      try {
        // Use a timeout here too
        const refreshPromise = supabase.auth.refreshSession()
        const refreshTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Refresh timeout')), SESSION_CHECK_TIMEOUT)
        )
        
        await Promise.race([refreshPromise, refreshTimeout])
        console.log('✅ Force refresh complete')
      } catch (refreshError) {
        console.error('❌ Force refresh failed:', refreshError.message)
        // Continue anyway - user can retry their action
      }
    }
  }
}

// Auto-start on import
if (typeof window !== 'undefined') {
  // Start immediately when module loads
  startKeepAlive()
}

export default { startKeepAlive, stopKeepAlive }