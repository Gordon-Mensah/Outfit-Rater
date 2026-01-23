// App.jsx - FIXED VERSION with visible action buttons + AI STYLIST
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import imageCompression from 'browser-image-compression'
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
import LandingPage from './LandingPage'
import VirtualWardrobe from './VirtualWardrobe'
import StyleContext from './StyleContext'
import { fetchWeather } from './weatherIntegration'
import { getCityCoordinates } from './cityCoordinates'
import { cities, workplaces, socialScenes } from './contextData'
//  NEW: AI Stylist imports
import StylistSelector from './StylistSelector'
import { getStylist } from './stylistPersonalities'



const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function App() {
  const { user, isPremium, canRate, dailyRatingCount, checkDailyRatings, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // SINGLE MODE STATES
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  // COMPARISON MODE STATES
  const [comparisonImages, setComparisonImages] = useState([])
  const [comparisonPreviews, setComparisonPreviews] = useState([])
  
  // SHARED STATES
  const [comparisonMode, setComparisonMode] = useState(false)
  const [occasion, setOccasion] = useState('none')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedbackMode, setFeedbackMode] = useState('helpful')
  
  // MODAL STATES
  const [showHistory, setShowHistory] = useState(false)
  const [outfitHistory, setOutfitHistory] = useState([])
  const [showSavedOutfits, setShowSavedOutfits] = useState(false)
  const [savedOutfits, setSavedOutfits] = useState([])
  const [savedCount, setSavedCount] = useState(0)
  const [showLastRatingWarning, setShowLastRatingWarning] = useState(false)
  const [pendingRatingAction, setPendingRatingAction] = useState(null)
  
  //  NEW: AI STYLIST STATES
  const [showStylistSelector, setShowStylistSelector] = useState(false)
  const [currentStylist, setCurrentStylist] = useState('minimalist')

  // ========== Load saved count on mount ==========
  useEffect(() => {
    if (user) {
      loadSavedCount()
    }
  }, [user])

  const loadSavedCount = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
      if (error) throw error
      setSavedCount(data?.length || 0)
    } catch (err) {
      console.error('Error loading saved count:', err)
    }
  }
  
  //  NEW: Load user's stylist preference
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
        .eq('id', user.id)
        .single()
      
      if (data?.stylist_preference) {
        setCurrentStylist(data.stylist_preference)
        console.log('✅ Loaded stylist:', data.stylist_preference)
      }
    } catch (err) {
      console.error('Error loading stylist:', err)
    }
  }

  //  NEW: Save stylist preference
  const handleSelectStylist = async (stylistId) => {
    setCurrentStylist(stylistId)
    
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ stylist_preference: stylistId })
        .eq('id', user.id)
      
      if (error) throw error
      console.log('✅ Stylist saved:', stylistId)
    } catch (err) {
      console.error('Error saving stylist:', err)
    }
  }

  // ========== KEEP-WARM PING: Prevents API cold starts ==========
  useEffect(() => {
    if (!user) return

    // Ping API every 5 minutes to keep it warm
    const keepWarm = setInterval(async () => {
      try {
        await fetch(`${API_BASE_URL}/api/ping`)
        console.log('🔥 API kept warm')
      } catch (err) {
        console.log('❌ Ping failed:', err)
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Initial ping on app load
    fetch(`${API_BASE_URL}/api/ping`)
      .then(() => console.log('🔥 Initial ping successful'))
      .catch(() => console.log('❌ Initial ping failed'))

    return () => clearInterval(keepWarm)
  }, [user])
  // ========== END KEEP-WARM PING ==========

  useEffect(() => {
    // Check if Stripe is already loaded
    if (window.Stripe) {
      console.log('✅ Stripe already loaded')
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]')
    if (existingScript) {
      console.log('✅ Stripe script already in DOM')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = () => console.log('✅ Stripe.js loaded')
    script.onerror = () => console.error('❌ Failed to load Stripe.js')
    document.body.appendChild(script)

    return () => {
      // Don't remove script on cleanup to avoid reloading
      // The script can stay for the entire session
    }
  }, [])

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  const loadHistory = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('outfit_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      setOutfitHistory(data || [])
    } catch (err) {
      console.error('Error loading history:', err)
    }
  }

  const loadSavedOutfits = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setSavedOutfits(data || [])
    } catch (err) {
      console.error('Error loading saved outfits:', err)
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true }
      const compressedFile = await imageCompression(file, options)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result)
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('Failed to process image')
    }
  }

  const handleComparisonImageSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    try {
      const processedImages = []
      const previews = []
      
      for (const file of files) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true }
        const compressedFile = await imageCompression(file, options)
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(compressedFile)
        })
        processedImages.push(base64)
        previews.push(base64)
      }
      
      setComparisonImages(processedImages)
      setComparisonPreviews(previews)
    } catch (err) {
      console.error('Error processing images:', err)
      setError('Failed to process images')
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const removeComparisonImage = (index) => {
    setComparisonImages(prev => prev.filter((_, i) => i !== index))
    setComparisonPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const executeRating = async () => {
    if (!user) {
      alert('Please sign in to rate outfits')
      return
    }

    if (!image) {
      alert('Please upload an image first')
      return
    }

    if (!canRate && !isPremium) {
      setShowLastRatingWarning(true)
      setPendingRatingAction('rate')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get user's context (location, workplace, etc.)
      const { data: profile } = await supabase
        .from('profiles')
        .select('style_context')
        .eq('id', user.id)
        .single()

      let contextToSend = null

      if (profile?.style_context) {
        const savedContext = profile.style_context
        
        // Build context object
        const cityData = cities.find(c => c.value === savedContext.city)
        const workplaceData = workplaces.find(w => w.value === savedContext.workplace)
        const socialSceneData = socialScenes.find(s => s.value === savedContext.socialScene)

        contextToSend = {
          city: savedContext.city,
          cityLabel: cityData?.label || savedContext.city,
          climate: cityData?.climate,
          culture: cityData?.culture,
          workplace: savedContext.workplace,
          workplaceLabel: workplaceData?.label || savedContext.workplace,
          formality: savedContext.formality,
          workplaceDescription: workplaceData?.description,
          socialScene: savedContext.socialScene,
          socialSceneLabel: socialSceneData?.label || savedContext.socialScene,
          sceneDescription: socialSceneData?.description,
          ageGroup: savedContext.ageGroup
        }

        // Add real-time weather if city has coordinates
        const cityCoords = getCityCoordinates(savedContext.city)
        if (cityCoords) {
          try {
            console.log('🌤️ Fetching weather for:', savedContext.city, cityCoords)
            const weather = await fetchWeather(cityCoords.lat, cityCoords.lon)
            if (weather) {
              contextToSend.weather = {
                temp: weather.temp,
                condition: weather.condition,
                description: weather.description,
                humidity: weather.humidity
              }
              console.log('✅ Weather added:', contextToSend.weather)
            }
          } catch (err) {
            console.log('⚠️ Weather fetch failed, continuing without it:', err)
          }
        }
      }

      console.log(' Sending rating request with context:', contextToSend ? 'Yes' : 'No')
      console.log(' Using stylist:', currentStylist) // ✨ NEW: Log stylist

      const response = await fetch(`${API_BASE_URL}/api/rate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          occasion,
          mode: feedbackMode,
          userId: user.id,
          context: contextToSend,
          stylistId: currentStylist //  NEW: Send stylist ID
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      await checkDailyRatings()

      await supabase.from('outfit_history').insert({
        user_id: user.id,
        image_url: image,
        rating: data.rating,
        feedback: data.feedback,
        occasion,
        feedback_mode: feedbackMode,
        created_at: new Date().toISOString()
      })

      navigate('/rate-result', { 
        state: { 
          rating: data.rating, 
          feedback: data.feedback, 
          imageUrl: image,
          contextUsed: data.contextUsed || false,
          weatherUsed: data.weatherUsed || false,
          stylistUsed: currentStylist //  NEW: Pass stylist to result
        } 
      })
    } catch (err) {
      console.error('Rating error:', err)
      setError(err.message || 'Failed to rate outfit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const executeComparison = async () => {
    if (!user) {
      alert('Please sign in to compare outfits')
      return
    }

    if (comparisonImages.length < 2) {
      alert('Please upload at least 2 images to compare')
      return
    }

    if (!canRate && !isPremium) {
      setShowLastRatingWarning(true)
      setPendingRatingAction('compare')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get user's context
      const { data: profile } = await supabase
        .from('profiles')
        .select('style_context')
        .eq('id', user.id)
        .single()

      let contextToSend = null

      if (profile?.style_context) {
        const savedContext = profile.style_context
        
        const cityData = cities.find(c => c.value === savedContext.city)
        const workplaceData = workplaces.find(w => w.value === savedContext.workplace)
        const socialSceneData = socialScenes.find(s => s.value === savedContext.socialScene)

        contextToSend = {
          city: savedContext.city,
          cityLabel: cityData?.label || savedContext.city,
          climate: cityData?.climate,
          culture: cityData?.culture,
          workplace: savedContext.workplace,
          workplaceLabel: workplaceData?.label || savedContext.workplace,
          formality: savedContext.formality,
          workplaceDescription: workplaceData?.description,
          socialScene: savedContext.socialScene,
          socialSceneLabel: socialSceneData?.label || savedContext.socialScene,
          sceneDescription: socialSceneData?.description,
          ageGroup: savedContext.ageGroup
        }

        // Add real-time weather
        const cityCoords = getCityCoordinates(savedContext.city)
        if (cityCoords) {
          try {
            const weather = await fetchWeather(cityCoords.lat, cityCoords.lon)
            if (weather) {
              contextToSend.weather = {
                temp: weather.temp,
                condition: weather.condition,
                description: weather.description,
                humidity: weather.humidity
              }
            }
          } catch (err) {
            console.log(' Weather fetch failed:', err)
          }
        }
      }

      console.log(' Sending comparison request')
      console.log(' Using stylist:', currentStylist) //  NEW: Log stylist

      const response = await fetch(`${API_BASE_URL}/api/compare-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: comparisonImages,
          occasion,
          mode: feedbackMode,
          userId: user.id,
          context: contextToSend,
          stylistId: currentStylist //  NEW: Send stylist ID
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      await checkDailyRatings()

      navigate('/compare-result', { 
        state: { 
          results: data.results,
          images: comparisonImages,
          contextUsed: data.contextUsed || false,
          weatherUsed: data.weatherUsed || false,
          stylistUsed: currentStylist //  NEW: Pass stylist to result
        } 
      })
    } catch (err) {
      console.error('Comparison error:', err)
      setError('Failed to compare outfits. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const proceedWithAction = async () => {
    setShowLastRatingWarning(false)
    if (pendingRatingAction === 'rate') {
      await executeRating()
    } else if (pendingRatingAction === 'compare') {
      await executeComparison()
    }
    setPendingRatingAction(null)
  }

  const cancelAction = () => {
    setShowLastRatingWarning(false)
    setPendingRatingAction(null)
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  //  NEW: Get current stylist info for display
  const currentStylistInfo = getStylist(currentStylist)

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <div className="app">
            <div className="background-gradient">
              <div className="gradient-orb orb-1"></div>
              <div className="gradient-orb orb-2"></div>
              <div className="gradient-orb orb-3"></div>
              <div className="grid-overlay"></div>
            </div>

            <div className="content-wrapper">
              <nav className="top-nav">
                <h1 className="app-title">
                  FitCheck AI
                </h1>
                <div className="nav-actions">
                  <button onClick={() => navigate('/premium')} className="nav-link">
                     Premium
                  </button>
                  <button onClick={() => navigate('/fashion-chat')} className="nav-link">
                     Style Chat
                  </button>
                  <button onClick={() => navigate('/wardrobe')} className="nav-link">
                     Wardrobe
                  </button>
                  <button onClick={() => navigate('/style-context')} className="nav-link">
                     My Context
                  </button>
                  {/*  NEW: Stylist selector button */}
                  <button 
                    onClick={() => setShowStylistSelector(true)} 
                    className="nav-link stylist-nav-btn"
                    title="Change AI Stylist"
                  >
                    {currentStylistInfo.icon} {currentStylistInfo.name}
                  </button>
                  <HamburgerMenu />
                </div>
              </nav>

              <div className="hero-section">
                <div className="hero-badge">
                  <span className="badge-dot"></span>
                  AI-Powered Fashion Analysis
                </div>
                <h1 className="hero-title">
                  Rate Your Outfit
                  <span className="gradient-text"> with AI</span>
                </h1>
                <p className="hero-subtitle">
                  Get instant, personalized feedback on your style with our AI fashion consultant
                </p>
                
                {/*  NEW: Current stylist badge (visible only when stylist is selected) */}
                {currentStylist !== 'minimalist' && (
                  <div 
                    className="current-stylist-badge-hero"
                    onClick={() => setShowStylistSelector(true)}
                  >
                    <span className="stylist-icon-large">{currentStylistInfo.icon}</span>
                    <div className="stylist-info">
                      <p className="stylist-name">{currentStylistInfo.name}</p>
                      <p className="stylist-tagline">"{currentStylistInfo.tagline}"</p>
                    </div>
                    <button className="change-stylist-btn">Change</button>
                  </div>
                )}

                {!isPremium && (
                  <div className="rating-info">
                    <span className="rating-count">
                      {isPremium ? '∞' : `${Math.max(0, 3 - dailyRatingCount)}`} ratings left today
                    </span>
                    {!isPremium && (
                      <SimpleUpgradeButton text="Get Unlimited" />
                    )}
                  </div>
                )}
              </div>

              <div className="mode-toggle">
                <button
                  className={`mode-btn ${!comparisonMode ? 'active' : ''}`}
                  onClick={() => setComparisonMode(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  </svg>
                  Single Outfit
                </button>
                <button
                  className={`mode-btn ${comparisonMode ? 'active' : ''}`}
                  onClick={() => setComparisonMode(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
                  </svg>
                  Compare Outfits
                </button>
              </div>

              {!comparisonMode ? (
                <div className="upload-section">
                  <div className="occasion-selector">
                    <label className="selector-label">Occasion</label>
                    <select 
                      value={occasion} 
                      onChange={(e) => setOccasion(e.target.value)}
                      className="select-input"
                    >
                      <option value="none">General / Casual</option>
                      <option value="work">Work / Office</option>
                      <option value="date">Date Night</option>
                      <option value="party">Party / Night Out</option>
                      <option value="formal">Formal Event</option>
                      <option value="workout">Gym / Workout</option>
                    </select>
                  </div>

                  <div className="feedback-mode-selector">
                    <label className="selector-label">Feedback Style</label>
                    <div className="mode-buttons">
                      <button
                        className={`feedback-mode-btn ${feedbackMode === 'helpful' ? 'active' : ''}`}
                        onClick={() => setFeedbackMode('helpful')}
                      >
                         Helpful
                      </button>
                      <button
                        className={`feedback-mode-btn ${feedbackMode === 'honest' ? 'active' : ''}`}
                        onClick={() => setFeedbackMode('honest')}
                      >
                         Honest
                      </button>
                      <button
                        className={`feedback-mode-btn ${feedbackMode === 'roast' ? 'active' : ''}`}
                        onClick={() => setFeedbackMode('roast')}
                      >
                         Roast Me
                      </button>
                    </div>
                  </div>

                  <div className="upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      id="image-upload"
                      style={{ display: 'none' }}
                    />
                    
                    {!imagePreview ? (
                      <label htmlFor="image-upload" className="upload-area">
                        <p className="upload-text">Click to upload your outfit photo</p>
                        <p className="upload-hint">or drag and drop</p>
                      </label>
                    ) : (
                      <div className="preview-container">
                        <img src={imagePreview} alt="Outfit preview" className="preview-image" />
                        <button onClick={removeImage} className="remove-btn">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 6l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {imagePreview && (
                    <button
                      onClick={executeRating}
                      disabled={loading}
                      className="rate-button"
                    >
                      {loading ? (
                        <>
                          <div className="button-spinner"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Rate My Outfit
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="upload-section">
                  <div className="occasion-selector">
                    <label className="selector-label">Occasion</label>
                    <select 
                      value={occasion} 
                      onChange={(e) => setOccasion(e.target.value)}
                      className="select-input"
                    >
                      <option value="none">General / Casual</option>
                      <option value="work">Work / Office</option>
                      <option value="date">Date Night</option>
                      <option value="party">Party / Night Out</option>
                      <option value="formal">Formal Event</option>
                      <option value="workout">Gym / Workout</option>
                    </select>
                  </div>

                  <div className="feedback-mode-selector">
                    <label className="selector-label">Feedback Style</label>
                    <div className="mode-buttons">
                      <button
                        className={`feedback-mode-btn ${feedbackMode === 'helpful' ? 'active' : ''}`}
                        onClick={() => setFeedbackMode('helpful')}
                      >
                         Helpful
                      </button>
                      <button
                        className={`feedback-mode-btn ${feedbackMode === 'honest' ? 'active' : ''}`}
                        onClick={() => setFeedbackMode('honest')}
                      >
                         Honest
                      </button>
                      <button
                        className={`feedback-mode-btn ${feedbackMode === 'roast' ? 'active' : ''}`}
                        onClick={() => setFeedbackMode('roast')}
                      >
                         Roast Me
                      </button>
                    </div>
                  </div>

                  <div className="comparison-upload">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleComparisonImageSelect}
                      id="comparison-upload"
                      style={{ display: 'none' }}
                    />
                    
                    <label htmlFor="comparison-upload" className="upload-area">
                      <div className="upload-icon">📸</div>
                      <p className="upload-text">Upload 2-4 outfit photos to compare</p>
                      <p className="upload-hint">Select multiple files</p>
                    </label>

                    {comparisonPreviews.length > 0 && (
                      <div className="comparison-previews">
                        {comparisonPreviews.map((preview, index) => (
                          <div key={index} className="comparison-preview-item">
                            <img src={preview} alt={`Outfit ${index + 1}`} />
                            <button
                              onClick={() => removeComparisonImage(index)}
                              className="remove-btn-small"
                            >
                              ×
                            </button>
                            <span className="outfit-number">#{index + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {comparisonImages.length >= 2 && (
                    <button
                      onClick={executeComparison}
                      disabled={loading}
                      className="rate-button"
                    >
                      {loading ? (
                        <>
                          <div className="button-spinner"></div>
                          Comparing...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 11l3 3L22 4" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeWidth="2"/>
                          </svg>
                          Compare Outfits
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="error-message">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="quick-actions">
                <button
                  onClick={() => {
                    loadHistory()
                    setShowHistory(true)
                  }}
                  className="action-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  History
                </button>
                <button
                  onClick={() => {
                    loadSavedOutfits()
                    setShowSavedOutfits(true)
                  }}
                  className="action-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth="2"/>
                  </svg>
                  Saved ({savedCount})
                </button>
              </div>
            </div>

            {showHistory && (
              <RatingHistory
                outfitHistory={outfitHistory}
                onClose={() => setShowHistory(false)}
              />
            )}

            {showSavedOutfits && (
              <SavedOutfits
                savedOutfits={savedOutfits}
                onClose={() => setShowSavedOutfits(false)}
                onUpdate={loadSavedCount}
              />
            )}

            {showLastRatingWarning && (
              <LastRatingWarning
                onProceed={proceedWithAction}
                onCancel={cancelAction}
              />
            )}
            
            {/*  NEW: Stylist Selector Modal */}
            {showStylistSelector && (
              <StylistSelector
                currentStylist={currentStylist}
                onSelectStylist={handleSelectStylist}
                onClose={() => setShowStylistSelector(false)}
              />
            )}
          </div>
        }
      />
      <Route 
        path="/rate-result" 
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

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App