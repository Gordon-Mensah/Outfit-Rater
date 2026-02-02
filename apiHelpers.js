// apiHelpers.js - NEW FILE: Wrapper for API calls with automatic session refresh
import { supabase } from './supabaseClient'

/**
 * PROBLEM SOLVER: This fixes the "buttons not working after coming back" issue
 * 
 * When users leave and return:
 * 1. Their auth token may have expired
 * 2. API calls fail silently
 * 3. Buttons look like they're working but give wrong responses
 * 
 * SOLUTION: This wrapper automatically refreshes tokens and retries failed requests
 */

// ⭐ Wrapper for Supabase queries with automatic retry
export const safeQuery = async (queryFn, retries = 1) => {
  try {
    // First attempt
    const result = await queryFn()
    
    // If error is auth-related, refresh session and retry
    if (result.error) {
      const isAuthError = 
        result.error.message?.includes('JWT') ||
        result.error.message?.includes('expired') ||
        result.error.message?.includes('invalid') ||
        result.error.code === 'PGRST301' ||
        result.error.code === '401'
      
      if (isAuthError && retries > 0) {
        console.log('🔄 Auth error detected, refreshing session...')
        
        // Refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (!refreshError && session) {
          console.log('✅ Session refreshed, retrying request...')
          // Retry the original query
          return await queryFn()
        } else {
          console.error('❌ Session refresh failed:', refreshError)
          // Session is dead, user needs to re-login
          await supabase.auth.signOut()
          window.location.href = '/login'
          return result
        }
      }
    }
    
    return result
  } catch (error) {
    console.error('❌ safeQuery error:', error)
    throw error
  }
}

// ⭐ Wrapper for fetch calls to your API with retry
export const safeFetch = async (url, options = {}, retries = 1) => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.error('❌ No active session')
      window.location.href = '/login'
      return null
    }

    // Add auth header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }

    // Make request
    const response = await fetch(url, {
      ...options,
      headers
    })

    // If unauthorized and we have retries left
    if (response.status === 401 && retries > 0) {
      console.log('🔄 401 error, refreshing session...')
      
      // Refresh session
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      
      if (!error && newSession) {
        console.log('✅ Session refreshed, retrying fetch...')
        
        // Retry with new token
        const newHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newSession.access_token}`,
          'Content-Type': 'application/json',
        }
        
        return await fetch(url, {
          ...options,
          headers: newHeaders
        })
      } else {
        console.error('❌ Session refresh failed')
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
    }

    return response
  } catch (error) {
    console.error('❌ safeFetch error:', error)
    throw error
  }
}

// ⭐ Check if session is still valid before making important calls
export const ensureValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      console.log('⚠️ No valid session, redirecting to login...')
      await supabase.auth.signOut()
      window.location.href = '/login'
      return false
    }
    
    // Check if token is about to expire (within 5 minutes)
    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    const minutesUntilExpiry = (expiresAt - now) / 1000 / 60
    
    if (minutesUntilExpiry < 5) {
      console.log('⏰ Token expiring soon, refreshing...')
      const { error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Failed to refresh expiring token')
        await supabase.auth.signOut()
        window.location.href = '/login'
        return false
      }
      
      console.log('✅ Token refreshed preemptively')
    }
    
    return true
  } catch (error) {
    console.error('❌ ensureValidSession error:', error)
    return false
  }
}

// ⭐ USAGE EXAMPLES:
/*

// BEFORE (Fails silently when token expires):
const { data, error } = await supabase
  .from('outfit_history')
  .select('*')
  .eq('user_id', userId)

// AFTER (Automatically refreshes and retries):
const { data, error } = await safeQuery(() =>
  supabase
    .from('outfit_history')
    .select('*')
    .eq('user_id', userId)
)

// BEFORE (Fetch to your API):
const response = await fetch('/api/rate-outfit', {
  method: 'POST',
  body: JSON.stringify(data)
})

// AFTER (With automatic retry):
const response = await safeFetch('/api/rate-outfit', {
  method: 'POST',
  body: JSON.stringify(data)
})

// BEFORE IMPORTANT ACTION (Ensure session is valid):
await ensureValidSession()
const result = await doImportantThing()

*/