// 📚 WHAT IS THIS FILE?
// This is our "Auth Context" - a special React feature that lets us
// share the current user's information across ALL pages without passing props.
//
// Think of it like a bulletin board that every room (component) in your 
// house (app) can see. When someone logs in, we post it on the board,
// and every room knows who's logged in!

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// 🎯 CREATE THE CONTEXT
// This is our "bulletin board"
const AuthContext = createContext({})

// 🎁 CUSTOM HOOK (makes it easier to use)
// Instead of typing useContext(AuthContext) every time,
// we can just type useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

// 🏗️ THE PROVIDER COMPONENT
// This wraps our entire app and provides auth data to everyone
export function AuthProvider({ children }) {
  // 👤 STATE: Who's logged in?
  // null = nobody, object = user data
  const [user, setUser] = useState(null)
  
  // ⏳ STATE: Are we checking if someone's logged in?
  const [loading, setLoading] = useState(true)
  
  // 💳 STATE: Is this user a premium subscriber?
  const [isPremium, setIsPremium] = useState(false)
  
  // 🔢 STATE: How many ratings has user done today?
  const [dailyRatingCount, setDailyRatingCount] = useState(0)

  // 🔍 FUNCTION: Check subscription status
  const checkSubscription = async (userId) => {
    try {
      // Ask the database: "What's this user's subscription?"
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If no subscription exists, create a free one
        if (error.code === 'PGRST116') {
          await supabase.from('subscriptions').insert({
            user_id: userId,
            status: 'free',
            plan: 'free'
          })
          setIsPremium(false)
        }
        return
      }

      // Update our state
      setIsPremium(data.status === 'premium')
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  // 🔢 FUNCTION: Check how many ratings today
  const checkDailyRatings = async (userId) => {
    try {
      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Count ratings since midnight
      const { data, error } = await supabase
        .from('outfit_history')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())

      if (error) throw error
      
      setDailyRatingCount(data.length)
    } catch (error) {
      console.error('Error checking daily ratings:', error)
    }
  }

  // 🎬 EFFECT: Run when app loads
  useEffect(() => {
    // Check if someone's already logged in (from a previous session)
    checkUser()

    // Listen for auth changes (login, logout, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update user when auth state changes
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          // If logged in, check their subscription and daily count
          await checkSubscription(currentUser.id)
          await checkDailyRatings(currentUser.id)
        } else {
          // If logged out, reset everything
          setIsPremium(false)
          setDailyRatingCount(0)
        }
        
        setLoading(false)
      }
    )

    // Cleanup: stop listening when component unmounts
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  // 🔍 FUNCTION: Check current user
  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await checkSubscription(user.id)
        await checkDailyRatings(user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  // 📧 FUNCTION: Sign up new user
  const signUp = async (email, password) => {
    try {
      // Tell Supabase to create a new account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      // Success! Create their free subscription
      if (data.user) {
        await supabase.from('subscriptions').insert({
          user_id: data.user.id,
          status: 'free',
          plan: 'free'
        })
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // 🔐 FUNCTION: Sign in existing user
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // 🚪 FUNCTION: Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Reset all state
      setUser(null)
      setIsPremium(false)
      setDailyRatingCount(0)
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // ✅ FUNCTION: Can user rate an outfit?
  const canRate = () => {
    // Premium users can always rate
    if (isPremium) return true
    
    // Free users get 3 per day
    return dailyRatingCount < 3
  }

  // 🎁 THE VALUE WE'RE SHARING
  // Everything inside this object will be available
  // to ANY component that uses useAuth()
  const value = {
    user,              // Current user object
    isPremium,         // true/false
    dailyRatingCount,  // Number
    loading,           // true/false
    signUp,            // Function
    signIn,            // Function
    signOut,           // Function
    canRate,           // Function
    checkDailyRatings, // Function (refresh count)
  }

  // 🎨 RETURN THE PROVIDER
  // This wraps our app and makes 'value' available everywhere
  return (
    <AuthContext.Provider value={value}>
      {/* Show loading screen while checking auth */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

// 📖 HOW TO USE THIS:
//
// 1. Wrap your app in main.jsx:
//    <AuthProvider>
//      <App />
//    </AuthProvider>
//
// 2. Use in any component:
//    import { useAuth } from './AuthContext'
//    
//    function MyComponent() {
//      const { user, signOut, isPremium } = useAuth()
//      
//      if (!user) return <Login />
//      
//      return <div>Hello {user.email}!</div>
//    }