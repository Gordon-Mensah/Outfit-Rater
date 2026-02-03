// App.jsx - Modern Redesign with Improved Image Upload
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import imageCompression from 'browser-image-compression'
import { startKeepAlive } from './keepAlive'
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

  // Start keep-alive system when app mounts (runs once)
  useEffect(() => {
    console.log('🏓 Starting keep-alive system from App.jsx...')
    startKeepAlive()
  }, [])

  // Load user stylist preference when user logs in
  useEffect(() => {
    if (user) {
      loadUserStylist()
    }
  }, [user])

  // ✅ FIXED: Improved to handle missing profiles and create them automatically
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
      
      // If no profile exists, create one
      if (!data) {
        console.log('📝 No profile found, creating one...')
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            stylist_preference: 'minimalist'
          })
        
        if (insertError) {
          console.error('❌ Error creating profile:', insertError)
        } else {
          console.log('✅ Profile created with default stylist: minimalist')
          setCurrentStylist('minimalist')
        }
        return
      }
      
      // Profile exists, load the preference
      if (data.stylist_preference) {
        setCurrentStylist(data.stylist_preference)
        console.log('✅ Loaded stylist preference:', data.stylist_preference)
      }
    } catch (err) {
      console.error('❌ Error in loadUserStylist:', err)
    }
  }

  // ✅ FIXED: Improved to handle missing profiles
  const handleSelectStylist = async (stylistId) => {
    setCurrentStylist(stylistId)
    
    if (!user) return
    
    try {
      // Try to update first
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stylist_preference: stylistId })
        .eq('user_id', user.id)
      
      if (updateError) {
        // If update fails, profile might not exist - create it
        console.log('📝 Profile not found, creating with stylist:', stylistId)
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            stylist_preference: stylistId
          })
        
        if (insertError) {
          console.error('❌ Error creating profile:', insertError)
        } else {
          console.log('✅ Profile created with stylist:', stylistId)
        }
      } else {
        console.log('✅ Stylist preference saved:', stylistId)
      }
    } catch (err) {
      console.error('❌ Error saving stylist:', err)
    }
  }

  // Load Stripe script
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
      {/* Background */}
      <div className="rate-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Content */}
      <div className="rate-content">
        {/* Header */}
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

        {/* Welcome Section */}
        <section className="welcome-section">
          <h1 className="welcome-heading">Rate Your Outfit</h1>
          <p className="welcome-subtitle">
            Upload a photo and get instant AI-powered feedback
          </p>
        </section>

        {/* Stats Bar */}
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

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${!comparisonMode ? 'active' : ''}`}
            onClick={() => {
              setComparisonMode(false)
              setComparisonImages([])
              setComparisonPreviews([])
              setError(null)
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15l-5-5L5 21" strokeWidth="2"/>
            </svg>
            Single Outfit
          </button>
          <button
            className={`mode-btn ${comparisonMode ? 'active' : ''}`}
            onClick={() => {
              setComparisonMode(true)
              setImage(null)
              setImagePreview(null)
              setError(null)
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="18" rx="1" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="18" rx="1" strokeWidth="2"/>
            </svg>
            Compare Outfits
          </button>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {!comparisonMode ? (
            /* Single Outfit Mode - IMPROVED UPLOAD */
            <>
              <div className="upload-section">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="upload-area">
                  {imagePreview ? (
                    <div className="preview-container">
                      <img src={imagePreview} alt="Outfit preview" className="preview-image" />
                      <div className="change-image-overlay">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span>Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <p className="upload-title">Upload Your Outfit</p>
                      <p className="upload-subtitle">Click to select a photo or drag & drop</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="options-section">
                <div className="form-group">
                  <label htmlFor="occasion" className="form-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                    </svg>
                    Occasion
                  </label>
                  <select
                    id="occasion"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="form-select"
                  >
                    <option value="none">General / No specific occasion</option>
                    <option value="casual">Casual hangout</option>
                    <option value="date">First date</option>
                    <option value="interview">Job interview</option>
                    <option value="wedding">Wedding</option>
                    <option value="gym">Gym / Workout</option>
                    <option value="night">Night out</option>
                    <option value="work">Work / Office</option>
                    <option value="beach">Beach / Vacation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="feedback-mode" className="form-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2"/>
                    </svg>
                    Feedback Style
                  </label>
                  <select
                    id="feedback-mode"
                    value={feedbackMode}
                    onChange={(e) => setFeedbackMode(e.target.value)}
                    className="form-select"
                  >
                    <option value="helpful">Helpful - Encouraging & constructive</option>
                    <option value="honest">Honest - Balanced & realistic</option>
                    {isPremium && <option value="roast">Roast - Brutally honest</option>}
                  </select>
                  {!isPremium && feedbackMode === 'roast' && (
                    <p className="premium-note">Roast mode requires Premium</p>
                  )}
                </div>

                <button
                  className="stylist-selector-btn"
                  onClick={() => setShowStylistSelector(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                  </svg>
                  Personal Stylist: {getStylist(currentStylist)?.name || 'Minimalist'}
                </button>
              </div>

              {error && (
                <div className="error-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={rateOutfit}
                disabled={!image || loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2"/>
                    </svg>
                    Rate My Outfit
                  </>
                )}
              </button>
            </>
          ) : (
            /* Comparison Mode */
            <>
              <div className="comparison-info">
                <h3 className="comparison-title">Compare Multiple Outfits</h3>
                <p className="comparison-subtitle">
                  Upload 2-5 photos to compare side-by-side
                </p>
              </div>

              <div className="upload-section">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleComparisonImages}
                  id="comparison-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="comparison-upload" className="upload-area comparison">
                  {comparisonPreviews.length > 0 ? (
                    <div className="comparison-grid">
                      {comparisonPreviews.map((preview, index) => (
                        <div key={index} className="comparison-item">
                          <img src={preview} alt={`Outfit ${index + 1}`} />
                          <span className="comparison-label">Outfit {index + 1}</span>
                        </div>
                      ))}
                      <div className="add-more">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/>
                          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                        </svg>
                        <span>Add More</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="7" height="18" rx="1" strokeWidth="2"/>
                        <rect x="14" y="3" width="7" height="18" rx="1" strokeWidth="2"/>
                      </svg>
                      <p className="upload-title">Upload 2-5 Outfits</p>
                      <p className="upload-subtitle">Select multiple photos at once</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="options-section">
                <div className="form-group">
                  <label htmlFor="occasion-compare" className="form-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                    </svg>
                    Occasion
                  </label>
                  <select
                    id="occasion-compare"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="form-select"
                  >
                    <option value="none">General / No specific occasion</option>
                    <option value="casual">Casual hangout</option>
                    <option value="date">First date</option>
                    <option value="interview">Job interview</option>
                    <option value="wedding">Wedding</option>
                    <option value="gym">Gym / Workout</option>
                    <option value="night">Night out</option>
                    <option value="work">Work / Office</option>
                    <option value="beach">Beach / Vacation</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={compareOutfits}
                disabled={comparisonImages.length < 2 || loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Comparing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="9 11 12 14 22 4" strokeWidth="2"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/>
                    </svg>
                    Compare Outfits
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <button onClick={() => navigate('/wardrobe')} className="quick-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeWidth="2"/>
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/>
              <path d="M16 10a4 4 0 0 1-8 0" strokeWidth="2"/>
            </svg>
            Virtual Wardrobe
          </button>
          <button onClick={() => navigate('/history')} className="quick-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
            </svg>
            Rating History
          </button>
          <button onClick={() => navigate('/saved-outfits')} className="quick-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeWidth="2"/>
            </svg>
            Saved Outfits
          </button>
        </div>

        {/* Premium Upsell */}
        {!isPremium && (
          <div className="premium-upsell">
            <div className="upsell-content">
              <div className="upsell-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2"/>
                </svg>
              </div>
              <div className="upsell-text">
                <h3>Upgrade to Premium</h3>
                <p>Unlimited ratings, AI chat, and advanced features</p>
              </div>
              <SimpleUpgradeButton text="Upgrade Now" />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
  )

  return (
    <Routes>
      <Route 
        path="/" 
        element={!user ? <LandingPage /> : <Navigate to="/rate" replace />} 
      />
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/rate" replace />} 
      />
      <Route 
        path="/signup" 
        element={!user ? <SignUp /> : <Navigate to="/rate" replace />} 
      />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App