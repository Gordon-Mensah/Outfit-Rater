// App.jsx - NATIVE APP VERSION (No Landing Page)
// This version is designed for mobile apps, not websites

import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import imageCompression from 'browser-image-compression'
import { startKeepAlive } from './keepAlive'
import { StatusBar, Style } from '@capacitor/status-bar'
import Login from './Login'
import SignUp from './SignUp'
import RateResult from './RateResult'
import CompareResult from './CompareResult'
import ProfileSettings from './ProfileSettings'
import RatingHistory from './RatingHistory'
import SavedOutfits from './SavedOutfits'
import HamburgerMenu from './Hamburgermenu'
import LastRatingWarning from './LastRatingWarning'
import Premium from './PremiumStyleChat'
import SimpleUpgradeButton from './SimpleUpgradeButton'
import FashionChatPage from './FashionChatPage'
import ReferralSystem from './ReferralSystem'
import VirtualWardrobe from './VirtualWardrobe'
import StyleContext from './StyleContext'
import { fetchWeather } from './weatherIntegration'
import { getCityCoordinates } from './cityCoordinates'
import { cities, workplaces, socialScenes } from './contextData'
import StylistSelector from './StylistSelector'
import { getStylist } from './stylistPersonalities'
import AIClosetSimulator from './AIClosetSimulator'
import './App.css'

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function App() {
  const { user, isPremium, canRate, dailyRatingCount, checkDailyRatings, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [comparisonImages, setComparisonImages] = useState([])
  const [comparisonPreviews, setComparisonPreviews] = useState([])
  const [comparisonMode, setComparisonMode] = useState(false)
  const [occasion, setOccasion] = useState('none')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedbackMode, setFeedbackMode] = useState('helpful')
  const [showLastRatingWarning, setShowLastRatingWarning] = useState(false)
  const [pendingRatingAction, setPendingRatingAction] = useState(null)
  const [showStylistSelector, setShowStylistSelector] = useState(false)
  const [currentStylist, setCurrentStylist] = useState('minimalist')

  // Configure native status bar
  useEffect(() => {
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' })
      } catch (err) {
        console.log('Status bar not available (web mode)')
      }
    }
    setupStatusBar()
  }, [])

  // Start keep-alive
  useEffect(() => {
    console.log('🏓 Starting keep-alive system...')
    startKeepAlive()
  }, [])

  // Load user stylist preference
  useEffect(() => {
    if (user) {
      loadUserStylist()
    }
  }, [user])

  const loadUserStylist = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stylist_preference')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) {
        console.error('Error loading stylist:', error)
        return
      }
      
      if (!data) {
        console.log('📝 Creating profile with default stylist')
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            stylist_preference: 'minimalist'
          })
        
        if (insertError) {
          console.error('❌ Error creating profile:', insertError)
        } else {
          setCurrentStylist('minimalist')
        }
        return
      }
      
      if (data.stylist_preference) {
        setCurrentStylist(data.stylist_preference)
      }
    } catch (err) {
      console.error('❌ Error in loadUserStylist:', err)
    }
  }

  const handleSelectStylist = async (stylistId) => {
    setCurrentStylist(stylistId)
    
    if (!user) return
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stylist_preference: stylistId })
        .eq('user_id', user.id)
      
      if (updateError) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            stylist_preference: stylistId
          })
        
        if (insertError) {
          console.error('❌ Error creating profile:', insertError)
        }
      }
    } catch (err) {
      console.error('❌ Error saving stylist:', err)
    }
  }

  // Load Stripe
  useEffect(() => {
    if (window.Stripe) return
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]')
    if (existingScript) return
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    document.body.appendChild(script)
  }, [])

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)
      setImage(compressedFile)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(compressedFile)
      setError(null)
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('Failed to process image.')
    }
  }

  const handleComparisonImages = async (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length < 2) {
      setError('Please select at least 2 images')
      return
    }
    if (files.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    if (!isPremium && files.length > 2) {
      setError('Free users can compare up to 2 outfits. Upgrade to Premium for up to 5.')
      return
    }

    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
      const compressedFiles = await Promise.all(
        files.map(file => imageCompression(file, options))
      )
      
      setComparisonImages(compressedFiles)
      
      const previews = await Promise.all(
        compressedFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
        })
      )
      
      setComparisonPreviews(previews)
      setError(null)
    } catch (err) {
      console.error('Error processing images:', err)
      setError('Failed to process images')
    }
  }

  const rateOutfit = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!canRate) {
      setError('Daily rating limit reached. Upgrade to Premium for unlimited ratings.')
      return
    }

    if (dailyRatingCount >= 4 && !isPremium) {
      setPendingRatingAction(() => rateOutfit)
      setShowLastRatingWarning(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const base64Image = imagePreview

      let context = null
      const { data: profileData } = await supabase
        .from('profiles')
        .select('style_context')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileData?.style_context) {
        const sc = profileData.style_context
        context = {
          city: sc.city,
          cityLabel: cities.find(c => c.value === sc.city)?.label,
          climate: cities.find(c => c.value === sc.city)?.climate,
          culture: cities.find(c => c.value === sc.city)?.culture,
          workplace: sc.workplace,
          workplaceLabel: workplaces.find(w => w.value === sc.workplace)?.label,
          formality: workplaces.find(w => w.value === sc.workplace)?.formality,
          socialScene: sc.socialScene,
          socialSceneLabel: socialScenes.find(s => s.value === sc.socialScene)?.label,
          ageGroup: sc.ageGroup
        }

        if (sc.city) {
          const coords = getCityCoordinates(sc.city)
          if (coords) {
            const weather = await fetchWeather(coords.lat, coords.lon)
            if (weather) {
              context.weather = weather
            }
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/rate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          occasion,
          mode: feedbackMode,
          userId: user.id,
          context,
          stylistId: currentStylist
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get rating')
      }

      const data = await response.json()

      await supabase.from('outfit_history').insert({
        user_id: user.id,
        rating: data.rating,
        feedback: data.feedback,
        occasion
      })

      await checkDailyRatings()

      navigate('/result', {
        state: {
          rating: data.rating,
          feedback: data.feedback,
          imagePreview,
          occasion
        }
      })

    } catch (err) {
      console.error('Error:', err)
      setError('Failed to rate outfit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const compareOutfits = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (comparisonImages.length < 2) {
      setError('Please upload at least 2 images')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let context = null
      const { data: profileData } = await supabase
        .from('profiles')
        .select('style_context')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileData?.style_context) {
        const sc = profileData.style_context
        context = {
          city: sc.city,
          cityLabel: cities.find(c => c.value === sc.city)?.label,
          climate: cities.find(c => c.value === sc.city)?.climate,
          culture: cities.find(c => c.value === sc.city)?.culture,
          workplace: sc.workplace,
          workplaceLabel: workplaces.find(w => w.value === sc.workplace)?.label,
          formality: workplaces.find(w => w.value === sc.workplace)?.formality,
          socialScene: sc.socialScene,
          socialSceneLabel: socialScenes.find(s => s.value === sc.socialScene)?.label
        }

        if (sc.city) {
          const coords = getCityCoordinates(sc.city)
          if (coords) {
            const weather = await fetchWeather(coords.lat, coords.lon)
            if (weather) {
              context.weather = weather
            }
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/compare-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: comparisonPreviews,
          occasion,
          userId: user.id,
          context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to compare outfits')
      }

      const data = await response.json()

      navigate('/compare-result', {
        state: {
          ratings: data.ratings,
          bestIndex: data.bestIndex,
          analysis: data.analysis,
          mixSuggestion: data.mixSuggestion,
          images: comparisonPreviews,
          occasion
        }
      })

    } catch (err) {
      console.error('Error:', err)
      setError('Failed to compare outfits. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const MainAppContent = () => (
    <div className="rate-page">
      <div className="rate-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="rate-content">
        <header className="rate-header">
          <div className="header-left">
            <div className="app-logo">
              <div className="logo-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15l-5-5L5 21" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="logo-text">AI Outfit Rater</span>
            </div>
          </div>
          <div className="header-right">
            <HamburgerMenu />
          </div>
        </header>

        <section className="welcome-section">
          <h1 className="welcome-heading">Rate Your Outfit</h1>
          <p className="welcome-subtitle">
            Upload a photo and get instant AI-powered feedback
          </p>
        </section>

        <div className="stats-bar">
          <div className="stat-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
            </svg>
            <span>{isPremium ? 'Unlimited' : `${dailyRatingCount}/5`} ratings today</span>
          </div>
          {!isPremium && (
            <div className="stat-item premium-cta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2"/>
              </svg>
              <span>Upgrade for unlimited</span>
            </div>
          )}
        </div>

        {/* REST OF YOUR MAINAPPCONTENNT CODE STAYS THE SAME */}
        {/* ... I'm omitting it here for brevity ... */}

        {showLastRatingWarning && (
          <LastRatingWarning
            onProceed={() => {
              setShowLastRatingWarning(false)
              if (pendingRatingAction) {
                pendingRatingAction()
              }
            }}
            onCancel={() => setShowLastRatingWarning(false)}
          />
        )}

        {showStylistSelector && (
          <StylistSelector
            currentStylist={currentStylist}
            onSelectStylist={handleSelectStylist}
            onClose={() => setShowStylistSelector(false)}
          />
        )}
      </div>
    </div>
  )

  // ✅ NATIVE APP ROUTES - NO LANDING PAGE
  return (
    <Routes>
      {/* Default route - main app or login */}
      <Route 
        path="/" 
        element={user ? <Navigate to="/rate" replace /> : <Navigate to="/login" replace />} 
      />
      
      {/* Auth pages */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/rate" replace />} 
      />
      <Route 
        path="/signup" 
        element={!user ? <SignUp /> : <Navigate to="/rate" replace />} 
      />
      
      {/* Protected routes */}
      <Route 
        path="/rate" 
        element={user ? <MainAppContent /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/result" 
        element={user ? <RateResult /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/compare-result" 
        element={user ? <CompareResult /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/profile" 
        element={user ? <ProfileSettings /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/history" 
        element={user ? <RatingHistory /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/saved-outfits" 
        element={user ? <SavedOutfits /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/premium" 
        element={user ? <Premium /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/fashion-chat" 
        element={user ? <FashionChatPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/referrals" 
        element={user ? <ReferralSystem /> : <Navigate to="/login" replace />} 
      />
      <Route path="/wardrobe" element={<VirtualWardrobe />} />
      <Route path="/style-context" element={<StyleContext />} />
      <Route 
        path="/closet-simulator" 
        element={user ? <AIClosetSimulator /> : <Navigate to="/login" replace />} 
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App