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

  const handlePendingReferral = async (userId) => {
    try {
      const pendingRef = localStorage.getItem("pendingReferral")
      const pendingPromo = localStorage.getItem("pendingPromo")

      if (!pendingRef && !pendingPromo) return

      if (pendingPromo) {
        const applied = JSON.parse(pendingPromo)
        await supabase.from("referral_transactions").insert({
          referee_id: userId,
          promo_code: applied.type === "influencer" ? applied.code : null,
          referral_code: applied.type === "user" ? applied.code : null,
          referrer_id: applied.referrerId,
          transaction_type: applied.type,
          referee_discount: applied.discount === "free" ? 4.99 : 0.998,
          status: "pending"
        })
      }

      if (pendingRef) {
        const { data: link } = await supabase
          .from("referral_links")
          .select("user_id")
          .eq("referral_code", pendingRef)
          .single()

        if (link) {
          await supabase.from("referral_transactions").insert({
            referee_id: userId,
            referral_code: pendingRef,
            referrer_id: link.user_id,
            transaction_type: "user",
            referee_discount: 0.998,
            status: "pending"
          })
        }
      }

      localStorage.removeItem("pendingReferral")
      localStorage.removeItem("pendingPromo")
    } catch (err) {
      console.error("❌ Google referral processing error:", err)
    }
  }

  useEffect(() => {
    if (user?.id) {
      handlePendingReferral(user.id)

      // ⭐ ADDED — Ensure Google OAuth users get a referral code
      ensureReferralCode(user.id)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    console.log('🔔 Setting up real-time subscription listener for user:', user.id)

    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Subscription changed in real-time:', payload)
          
          if (payload.new) {
            const premium = payload.new.status === 'active' && payload.new.plan === 'premium'
            console.log('✅ Premium status updated:', premium)
            setIsPremium(premium)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔕 Cleaning up subscription listener')
      supabase.removeChannel(channel)
    }
  }, [user?.id])

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
      console.log('🔍 Checking subscription for user:', userId)
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📝 Creating new subscription record')
          await supabase.from('subscriptions').insert({
            user_id: userId,
            status: 'free',
            plan: 'free'
          })
          setIsPremium(false)
        }
        return
      }

      const premium = data.status === 'active' && data.plan === 'premium'
      console.log('✅ Subscription check:', { status: data.status, plan: data.plan, isPremium: premium })
      setIsPremium(premium)
    } catch (error) {
      console.error('❌ Error checking subscription:', error)
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

  const refreshPremiumStatus = async () => {
    if (user?.id) {
      console.log('🔄 Manually refreshing premium status...')
      await checkSubscription(user.id)
      return isPremium
    }
    return false
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

        // ⭐ ADDED — Create permanent referral code
        const referralCode = data.user.id.slice(0, 8).toUpperCase()

        await supabase.from("referral_links").insert({
          user_id: data.user.id,
          referral_code: referralCode
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
    return dailyRatingCount < 5
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
    refreshPremiumStatus,
  }

  // ⭐ Ensures every user has a referral code (Google or Email)
  const ensureReferralCode = async (userId) => {
    try {
      const { data: existing } = await supabase
        .from("referral_links")
        .select("referral_code")
        .eq("user_id", userId)
        .single()

      if (!existing) {
        const referralCode = userId.slice(0, 8).toUpperCase()

        await supabase.from("referral_links").insert({
          user_id: userId,
          referral_code: referralCode
        })

        console.log("🎉 Referral code created for Google user:", referralCode)
      }
    } catch (err) {
      console.error("❌ Error ensuring referral code:", err)
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
