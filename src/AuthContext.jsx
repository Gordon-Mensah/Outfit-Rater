import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { startKeepAlive } from './keepAlive'

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

  // Start keep-alive system when AuthProvider mounts
  useEffect(() => {
    console.log('🔧 Initializing keep-alive system...')
    startKeepAlive()
  }, [])

  // Window focus handler with better timeout and error handling
  useEffect(() => {
    let isCheckingSession = false
    
    const handleFocus = async () => {
      if (isCheckingSession) {
        console.log('⚠️ Session check already in progress, skipping...')
        return
      }
      
      console.log('👀 Window focused - checking session instantly...')
      isCheckingSession = true
      
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        )
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])
        
        if (error) {
          console.error('❌ Session check error:', error)
          console.log('🔄 Attempting session refresh...')
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError && refreshData?.session) {
            console.log('✅ Session recovered via refresh')
            setUser(refreshData.session.user)
          }
          isCheckingSession = false
          return
        }
        
        if (session?.user) {
          console.log('✅ Session valid on focus')
          setUser(session.user)
          
          try {
            await Promise.race([
              Promise.all([
                checkSubscription(session.user.id),
                checkDailyRatings(session.user.id)
              ]),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Data refresh timeout')), 3000)
              )
            ])
          } catch (dataErr) {
            console.warn('⚠️ Data refresh slow/failed, continuing anyway')
          }
        } else {
          console.log('⚠️ No session on focus, trying refresh...')
          const { data: refreshData } = await supabase.auth.refreshSession()
          if (refreshData?.session) {
            console.log('✅ Session recovered')
            setUser(refreshData.session.user)
          }
        }
      } catch (err) {
        console.error('❌ Focus check error:', err.message)
        if (err.message === 'Session check timeout') {
          console.log('⚡ Timeout detected, force refreshing...')
          try {
            const refreshPromise = supabase.auth.refreshSession()
            const refreshTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Refresh timeout')), 2000)
            )
            const { data } = await Promise.race([refreshPromise, refreshTimeout])
            if (data?.session) {
              console.log('✅ Session recovered after timeout')
              setUser(data.session.user)
            }
          } catch (refreshErr) {
            console.error('❌ Force refresh failed:', refreshErr.message)
          }
        }
      } finally {
        isCheckingSession = false
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    console.log('🚀 AuthProvider starting...')
    
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout reached, forcing loading to false')
      setLoading(false)
    }, 6000)

    checkInitialSession().then(() => {
      clearTimeout(timeoutId)
    })

    // ✅ FIX: Ignore unconfirmed signups in auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth change:', event, session?.user?.email || 'No user')
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed automatically')
        }
        
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('🚪 User signed out')
          setUser(null)
          setIsPremium(false)
          setDailyRatingCount(0)
          setLoading(false)
          return
        }

        // ✅ KEY FIX: When email confirmation is required, Supabase fires
        // SIGNED_IN with a user but NO session. Treat this as "pending confirmation"
        // and do NOT set the user — otherwise App.jsx route guards bounce them to login.
        if (!session) {
          console.log('📧 Auth event with no session — likely awaiting email confirmation, ignoring')
          setLoading(false)
          return
        }
        
        const currentUser = session.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          checkSubscription(currentUser.id).catch(err => 
            console.warn('⚠️ Subscription check failed:', err)
          )
          checkDailyRatings(currentUser.id).catch(err => 
            console.warn('⚠️ Daily ratings check failed:', err)
          )
        } else {
          setIsPremium(false)
          setDailyRatingCount(0)
        }
        
        setLoading(false)
      }
    )

    const refreshInterval = setInterval(async () => {
      console.log('⏰ Auto-refreshing session (2min interval)...')
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        )
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])
        
        if (error) {
          if (error.message === 'Session check timeout') {
            console.warn('⚠️ Session check timed out during auto-refresh')
            return
          }
          console.error('❌ Session refresh error:', error)
          if (error.message?.includes('expired') || error.message?.includes('invalid')) {
            console.log('🚪 Session expired, signing out...')
            await supabase.auth.signOut()
          }
          return
        }
        
        if (session) {
          console.log('✅ Session is valid')
          const expiresAt = session.expires_at
          const now = Math.floor(Date.now() / 1000)
          const minutesUntilExpiry = (expiresAt - now) / 60
          
          if (minutesUntilExpiry < 15) {
            console.log('⚠️ Token expiring in', Math.floor(minutesUntilExpiry), 'min, refreshing...')
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (!refreshError) {
              console.log('✅ Token force-refreshed')
            } else {
              console.error('❌ Token refresh failed:', refreshError)
            }
          }
        } else {
          console.log('⚠️ No active session')
          setUser(null)
          setIsPremium(false)
          setDailyRatingCount(0)
        }
      } catch (err) {
        if (err.message === 'Session check timeout') {
          console.warn('⚠️ Auto-refresh timed out, will retry next cycle')
        } else {
          console.error('❌ Auto-refresh error:', err.message)
        }
      }
    }, 2 * 60 * 1000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(refreshInterval)
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkInitialSession = async (retryCount = 0) => {
    try {
      console.log('🔍 Checking initial session...')
      
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initial session check timeout')), 5000)
      )
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ])
      
      if (error) {
        if (error.message === 'Initial session check timeout') {
          console.warn('⚠️ Initial session check timed out')
          if (retryCount === 0) {
            console.log('🔄 Retrying once...')
            await new Promise(resolve => setTimeout(resolve, 1000))
            return checkInitialSession(1)
          }
        } else {
          console.error('❌ Error getting session:', error)
        }
        setLoading(false)
        return
      }
      
      const currentUser = session?.user ?? null
      console.log('👤 Initial session user:', currentUser?.email || 'None')
      setUser(currentUser)
      
      if (currentUser) {
        checkSubscription(currentUser.id).catch(err => 
          console.warn('⚠️ Initial subscription check failed:', err)
        )
        checkDailyRatings(currentUser.id).catch(err => 
          console.warn('⚠️ Initial ratings check failed:', err)
        )
      }
    } catch (error) {
      console.error('❌ checkInitialSession error:', error.message)
    } finally {
      console.log('✅ Setting loading to false')
      setLoading(false)
    }
  }

  // Process referrals after email confirmation
  const processPostConfirmationReferrals = async (userId) => {
    try {
      const pendingRef = localStorage.getItem("pendingReferral")
      const pendingPromo = localStorage.getItem("pendingPromo")
      const storedUserId = localStorage.getItem("pendingUserId")

      if (storedUserId && storedUserId !== userId) {
        console.log('⚠️ User ID mismatch, skipping referral processing')
        return
      }

      if (!pendingRef && !pendingPromo) return

      console.log('🎁 Processing post-confirmation referrals...')

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
        console.log('✅ Promo code referral processed')
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
          console.log('✅ User referral processed')
        }
      }

      localStorage.removeItem("pendingReferral")
      localStorage.removeItem("pendingPromo")
      localStorage.removeItem("pendingUserId")
    } catch (err) {
      console.error("❌ Post-confirmation referral error:", err)
    }
  }

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
      console.error("❌ Referral processing error:", err)
    }
  }

  useEffect(() => {
    if (user?.id) {
      handlePendingReferral(user.id)
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

  const isSessionValid = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return !error && !!session
    } catch {
      return false
    }
  }

  const refreshSession = async () => {
    try {
      console.log('🔄 Manually refreshing session...')
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Session refresh failed:', error)
        return false
      }
      
      if (session) {
        console.log('✅ Session refreshed')
        setUser(session.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Session refresh error:', error)
      return false
    }
  }

  // ✅ FIX: signUp no longer inserts DB records — user isn't confirmed yet.
  // Subscription + referral records are created on first login instead.
  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      // Note: data.session will be null when email confirmation is required.
      // DB record creation is deferred to signIn to avoid acting on unconfirmed users.
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // ✅ FIX: Create subscription + referral records here if they don't exist yet,
  // since this only runs after the user has confirmed their email.
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
  
      if (error) throw error
      
      if (data.user) {
        setUser(data.user)

        // Create subscription record if it doesn't exist yet
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (!existingSub) {
          console.log('📝 First login after confirmation — creating subscription record')
          await supabase.from('subscriptions').insert({
            user_id: data.user.id,
            status: 'free',
            plan: 'free'
          })

          // Create referral code too
          const referralCode = data.user.id.slice(0, 8).toUpperCase()
          await supabase
            .from('referral_links')
            .insert({ user_id: data.user.id, referral_code: referralCode })
            .select()
            // Silently ignore if already exists
            .then(({ error }) => {
              if (error && !error.message.includes('duplicate')) {
                console.error('❌ Referral link insert error:', error)
              }
            })
        }

        await processPostConfirmationReferrals(data.user.id)
        await checkSubscription(data.user.id)
        await checkDailyRatings(data.user.id)
      }
      
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
        console.log("🎉 Referral code created:", referralCode)
      }
    } catch (err) {
      console.error("❌ Error ensuring referral code:", err)
    }
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
    isSessionValid,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}