import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [dailyRatingCount, setDailyRatingCount] = useState(0)

  useEffect(() => {
    console.log('🚀 AuthProvider starting...')
    
    // CRITICAL: Set timeout to force loading to false after 3 seconds
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout reached, forcing loading to false')
      setLoading(false)
    }, 3000)

    checkUser().then(() => {
      clearTimeout(timeoutId)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth change:', event)
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          await checkSubscription(currentUser.id)
          await checkDailyRatings(currentUser.id)
        } else {
          setIsPremium(false)
          setDailyRatingCount(0)
        }
        
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(timeoutId)
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      console.log('🔍 Checking user...')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ Error getting user:', error)
        setLoading(false)
        return
      }
      
      console.log('👤 User:', user?.email || 'None')
      setUser(user)
      
      if (user) {
        await checkSubscription(user.id)
        await checkDailyRatings(user.id)
      }
    } catch (error) {
      console.error('❌ checkUser error:', error)
    } finally {
      console.log('✅ Setting loading to false')
      setLoading(false)
    }
  }

  const checkSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', userId)
        .single()

      if (error) {
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

      setIsPremium(data.status === 'premium')
    } catch (error) {
      console.error('Error checking subscription:', error)
      setIsPremium(false)
    }
  }

  const checkDailyRatings = async (userId) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('outfit_history')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())

      if (error) throw error
      
      setDailyRatingCount(data?.length || 0)
    } catch (error) {
      console.error('Error checking daily ratings:', error)
      setDailyRatingCount(0)
    }
  }

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

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

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setIsPremium(false)
      setDailyRatingCount(0)
      
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const canRate = () => {
    if (isPremium) return true
    return dailyRatingCount < 3
  }

  const value = {
    user,
    isPremium,
    dailyRatingCount,
    loading,
    signUp,
    signIn,
    signOut,
    canRate,
    checkDailyRatings,
  }

  // ALWAYS render children
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}