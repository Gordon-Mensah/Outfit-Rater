// App.jsx - Document 1 UI + Document 2 AI Stylist Features
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
import StylistSelector from './StylistSelector'
import { getStylist } from './stylistPersonalities'
import AIClosetSimulator from './AIClosetSimulator'

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
  const [showHistory, setShowHistory] = useState(false)
  const [outfitHistory, setOutfitHistory] = useState([])
  const [showSavedOutfits, setShowSavedOutfits] = useState(false)
  const [savedOutfits, setSavedOutfits] = useState([])
  const [savedCount, setSavedCount] = useState(0)
  const [showLastRatingWarning, setShowLastRatingWarning] = useState(false)
  const [pendingRatingAction, setPendingRatingAction] = useState(null)
  const [showStylistSelector, setShowStylistSelector] = useState(false)
  const [currentStylist, setCurrentStylist] = useState('minimalist')

  useEffect(() => {
    if (user) {
      loadSavedCount()
      loadUserStylist()
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

  useEffect(() => {
    if (!user) return

    const keepWarm = setInterval(async () => {
      try {
        await fetch(`${API_BASE_URL}/api/ping`)
        console.log('🔥 API kept warm')
      } catch (err) {
        console.log('❌ Ping failed:', err)
      }
    }, 5 * 60 * 1000)

    fetch(`${API_BASE_URL}/api/ping`)
      .then(() => console.log('🔥 Initial ping successful'))
      .catch(() => console.log('❌ Initial ping failed'))

    return () => clearInterval(keepWarm)
  }, [user])

  useEffect(() => {
    if (window.Stripe) {
      console.log('✅ Stripe already loaded')
      return
    }

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
      setShowHistory(true)
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
      setSavedCount(data?.length || 0)
      setShowSavedOutfits(true)
    } catch (err) {
      console.error('Error loading saved outfits:', err)
    }
  }

  const deleteSavedOutfit = async (outfitId) => {
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('id', outfitId)
        .eq('user_id', user.id)
      if (error) throw error
      loadSavedOutfits()
    } catch (err) {
      console.error('Error deleting outfit:', err)
    }
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
    console.log('📸 Files selected:', files.length)
    
    if (files.length < 2) {
      setError('Please select at least 2 images')
      return
    }
    if (files.length > 5) {
      setError('Maximum 5 images')
      return
    }

    try {
      const compressedFiles = []
      const previews = []
      for (const file of files) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
        const compressedFile = await imageCompression(file, options)
        compressedFiles.push(compressedFile)
        const reader = new FileReader()
        const preview = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(compressedFile)
        })
        previews.push(preview)
      }
      console.log('✅ Images processed:', compressedFiles.length)
      setComparisonImages(compressedFiles)
      setComparisonPreviews(previews)
      setError(null)
    } catch (err) {
      console.error('Error processing images:', err)
      setError('Failed to process images.')
    }
  }

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const rateOutfit = async () => {
    if (!canRate()) {
      setError('You have used your 5 free ratings today.')
      return
    }
    
    if (!image) {
      setError('Please upload an image first')
      return
    }

    if (!isPremium && dailyRatingCount === 4) {
      setPendingRatingAction('rate')
      setShowLastRatingWarning(true)
      return
    }

    await executeRating()
  }

  const executeRating = async () => {
    setLoading(true)
    setError(null)
    try {
      const base64Image = await readFileAsBase64(image)
      
      let contextToSend = null
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('style_context')
          .eq('id', user.id)
          .single()
        
        const savedContext = profile?.style_context || null
        
        if (savedContext && savedContext.city) {
          const cityData = cities.find(c => c.value === savedContext.city)
          const workData = workplaces.find(w => w.value === savedContext.workplace)
          const sceneData = socialScenes.find(s => s.value === savedContext.socialScene)
          
          contextToSend = {
            city: savedContext.city,
            cityLabel: cityData?.label,
            climate: cityData?.climate,
            culture: cityData?.culture,
            workplace: savedContext.workplace,
            workplaceLabel: workData?.label,
            formality: workData?.formality,
            workplaceDescription: workData?.description,
            socialScene: savedContext.socialScene,
            socialSceneLabel: sceneData?.label,
            sceneDescription: sceneData?.description,
            ageGroup: savedContext.ageGroup
          }
          
          try {
            const cityCoords = getCityCoordinates(savedContext.city)
            if (cityCoords) {
              const weather = await fetchWeather(cityCoords.lat, cityCoords.lon)
              if (weather) {
                contextToSend.weather = {
                  temp: weather.temp,
                  condition: weather.condition,
                  description: weather.description,
                  humidity: weather.humidity
                }
                console.log('✅ Weather data added:', weather)
              }
            }
          } catch (weatherErr) {
            console.log('ℹ️ Weather data unavailable, using general climate info')
          }
          
          console.log('✅ Full context loaded:', contextToSend)
        }
      } catch (contextErr) {
        console.log('ℹ️ Context not available, proceeding without it:', contextErr)
      }
      
      console.log('🎨 Using stylist:', currentStylist)
      
      const response = await fetch(`${API_BASE_URL}/api/rate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image, 
          occasion, 
          mode: feedbackMode, 
          userId: user.id,
          context: contextToSend,
          stylistId: currentStylist
        })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to rate outfit')
      
      await supabase.from('outfit_history').insert({
        user_id: user.id,
        rating: data.rating,
        feedback: data.feedback,
        occasion: occasion,
        created_at: new Date().toISOString()
      })
      await checkDailyRatings(user.id)
      
      navigate('/result', {
        state: { 
          rating: data.rating, 
          feedback: data.feedback, 
          imagePreview: imagePreview, 
          occasion: occasion,
          stylistUsed: currentStylist
        }
      })
    } catch (err) {
      console.error('Error rating outfit:', err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const compareOutfits = async () => {
    console.log('🔍 Compare button clicked')
    
    if (!canRate()) {
      setError('You have used your 5 free ratings today.')
      return
    }
    
    if (comparisonImages.length < 2) {
      setError('Please upload at least 2 images')
      return
    }

    if (!isPremium && dailyRatingCount === 4) {
      setPendingRatingAction('compare')
      setShowLastRatingWarning(true)
      return
    }

    await executeComparison()
  }

  const executeComparison = async () => {
    setLoading(true)
    setError(null)
    try {
      const base64Images = await Promise.all(
        comparisonImages.map(img => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(img)
          })
        })
      )
      
      console.log('🚀 Calling API...')
      
      let contextToSend = null
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('style_context')
          .eq('id', user.id)
          .single()
        
        const savedContext = profile?.style_context || null
        
        if (savedContext && savedContext.city) {
          const cityData = cities.find(c => c.value === savedContext.city)
          const workData = workplaces.find(w => w.value === savedContext.workplace)
          const sceneData = socialScenes.find(s => s.value === savedContext.socialScene)
          
          contextToSend = {
            city: savedContext.city,
            cityLabel: cityData?.label,
            climate: cityData?.climate,
            culture: cityData?.culture,
            workplace: savedContext.workplace,
            workplaceLabel: workData?.label,
            formality: workData?.formality,
            workplaceDescription: workData?.description,
            socialScene: savedContext.socialScene,
            socialSceneLabel: sceneData?.label,
            sceneDescription: sceneData?.description,
            ageGroup: savedContext.ageGroup
          }
          
          try {
            const cityCoords = getCityCoordinates(savedContext.city)
            if (cityCoords) {
              const weather = await fetchWeather(cityCoords.lat, cityCoords.lon)
              if (weather) {
                contextToSend.weather = {
                  temp: weather.temp,
                  condition: weather.condition,
                  description: weather.description,
                  humidity: weather.humidity
                }
              }
            }
          } catch (weatherErr) {
            console.log('Weather unavailable')
          }
        }
      } catch (contextErr) {
        console.log('Context not available')
      }
      
      console.log('🎨 Using stylist:', currentStylist)
      
      const response = await fetch(`${API_BASE_URL}/api/compare-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: base64Images, 
          occasion, 
          userId: user.id,
          context: contextToSend,
          stylistId: currentStylist
        })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to compare')
      
      await checkDailyRatings(user.id)
      
      navigate('/compare-result', {
        state: {
          results: data.results,
          images: comparisonPreviews,
          occasion: occasion,
          stylistUsed: currentStylist
        }
      })
    } catch (err) {
      console.error('Error comparing outfits:', err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  const currentStylistInfo = getStylist(currentStylist)

  const MainAppContent = () => (
    <div className="app">
      <LastRatingWarning
        isOpen={showLastRatingWarning}
        onClose={() => {
          setShowLastRatingWarning(false)
          setPendingRatingAction(null)
        }}
        onContinue={() => {
          if (pendingRatingAction === 'rate') {
            executeRating()
          } else if (pendingRatingAction === 'compare') {
            executeComparison()
          }
        }}
      />

      <div className="header">
        <h1>AI Outfit Rater</h1>
        <HamburgerMenu />
      </div>

      <div className="container">
        <div className="action-buttons">
          <button 
            onClick={loadHistory} 
            className="btn-secondary"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            View History
          </button>
          <button 
            onClick={loadSavedOutfits} 
            className="btn-secondary"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
             Saved Outfits ({savedCount}{!isPremium ? '/10' : ''})
          </button>
          <button 
            onClick={() => setShowStylistSelector(true)} 
            className="btn-secondary"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Change AI Stylist"
          >
            {currentStylistInfo.icon} {currentStylistInfo.name}
          </button>
        </div>

        <div className="mode-toggle">
          <button
            className={!comparisonMode ? 'active' : ''}
            onClick={() => {
              console.log('→ Switching to SINGLE mode')
              setComparisonMode(false)
              setError(null)
            }}
          >
            Single Outfit
          </button>
          <button
            className={comparisonMode ? 'active' : ''}
            onClick={() => {
              console.log('→ Switching to COMPARE mode')
              setComparisonMode(true)
              setError(null)
            }}
          >
            Compare Outfits
          </button>
        </div>

        {isPremium && !comparisonMode && (
          <div className="mode-selector">
            <label>Feedback Style:</label>
            <div className="mode-buttons">
              <button className={feedbackMode === 'helpful' ? 'active' : ''} onClick={() => setFeedbackMode('helpful')}>Helpful</button>
              <button className={feedbackMode === 'honest' ? 'active' : ''} onClick={() => setFeedbackMode('honest')}>Honest</button>
              <button className={feedbackMode === 'roast' ? 'active' : ''} onClick={() => setFeedbackMode('roast')}>Roast Mode</button>
            </div>
          </div>
        )}

        {showSavedOutfits && (
          <div className="modal-overlay" onClick={() => setShowSavedOutfits(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Saved Outfits</h2>
                <button onClick={() => setShowSavedOutfits(false)} className="btn-close">×</button>
              </div>
              <div className="saved-outfits-grid">
                {savedOutfits.length === 0 ? (
                  <p className="empty-message">No saved outfits yet.</p>
                ) : (
                  savedOutfits.map((outfit) => (
                    <div key={outfit.id} className="saved-outfit-card">
                      <img src={outfit.image_data} alt={outfit.name} />
                      <div className="saved-outfit-info">
                        <h3>{outfit.name}</h3>
                        <p className="rating" style={{ color: getRatingColor(outfit.rating) }}>{outfit.rating}/10</p>
                        <p className="occasion">{outfit.occasion}</p>
                        <p className="date">{new Date(outfit.created_at).toLocaleDateString()}</p>
                        <button onClick={() => deleteSavedOutfit(outfit.id)} className="btn-delete">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="modal-overlay" onClick={() => setShowHistory(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Rating History</h2>
                <button onClick={() => setShowHistory(false)} className="btn-close">×</button>
              </div>
              <div className="history-list">
                {outfitHistory.length === 0 ? (
                  <p className="empty-message">No ratings yet.</p>
                ) : (
                  outfitHistory.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-rating">
                        <span style={{ color: getRatingColor(item.rating) }}>{item.rating}/10</span>
                      </div>
                      <div className="history-details">
                        <p className="history-occasion">{item.occasion}</p>
                        <p className="history-date">{new Date(item.created_at).toLocaleDateString()}</p>
                        <p className="history-feedback">{item.feedback.substring(0, 100)}...</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {showStylistSelector && (
          <StylistSelector
            currentStylist={currentStylist}
            onSelectStylist={handleSelectStylist}
            onClose={() => setShowStylistSelector(false)}
          />
        )}

        {!comparisonMode && (
          <div>
            <div className="upload-zone">
              <input type="file" accept="image/*" onChange={handleImageChange} id="file-upload" style={{ display: 'none' }} />
              <label htmlFor="file-upload" className="upload-label">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <>
                    <div className="upload-icon">+</div>
                    <p>Click to upload outfit photo</p>
                  </>
                )}
              </label>
            </div>

            <div className="occasion-selector">
              <label htmlFor="occasion">Occasion:</label>
              <select id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                <option value="none">No specific occasion</option>
                <option value="casual">Casual hangout</option>
                <option value="date">First date</option>
                <option value="interview">Job interview</option>
                <option value="wedding">Wedding</option>
                <option value="gym">Gym/Workout</option>
                <option value="night">Night out</option>
                <option value="work">Work/Office</option>
                <option value="beach">Beach/Vacation</option>
              </select>
            </div>

            {error && <div className="error">{error}</div>}

            <button onClick={rateOutfit} disabled={!image || loading} className="btn-rate">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Rating...
                </>
              ) : (
                'Rate My Outfit'
              )}
            </button>
          </div>
        )}

        {comparisonMode && (
          <div>
            <div className="comparison-instructions">
              <h4>How to Compare Outfits:</h4>
              <ul>
                <li>Click the upload area below</li>
                <li>Select 2-5 outfit photos</li>
                <li>Wait for upload</li>
                <li>Click Compare button</li>
              </ul>
            </div>

            <div className="comparison-upload">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleComparisonImages}
                id="comparison-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="comparison-upload" className="upload-label">
                <div className="upload-icon">+</div>
                <p>Upload 2-5 outfits to compare</p>
                <small>💡 Hold Ctrl/Cmd to select multiple</small>
              </label>
            </div>

            {comparisonPreviews.length > 0 && (
              <div className="comparison-preview-grid">
                {comparisonPreviews.map((preview, index) => (
                  <div key={index} className="comparison-preview-item" data-index={index + 1}>
                    <img src={preview} alt={`Outfit ${index + 1}`} />
                    <p>Outfit {index + 1}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="occasion-selector">
              <label htmlFor="occasion">Occasion:</label>
              <select id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                <option value="none">No specific occasion</option>
                <option value="casual">Casual hangout</option>
                <option value="date">First date</option>
                <option value="interview">Job interview</option>
                <option value="wedding">Wedding</option>
                <option value="gym">Gym/Workout</option>
                <option value="night">Night out</option>
                <option value="work">Work/Office</option>
                <option value="beach">Beach/Vacation</option>
              </select>
            </div>

            {error && <div className="error">{error}</div>}

            <button
              onClick={compareOutfits}
              disabled={comparisonImages.length < 2 || loading}
              className="btn-rate comparison-mode"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Comparing...
                </>
              ) : (
                'Compare Outfits'
              )}
            </button>
          </div>
        )}
      </div>
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