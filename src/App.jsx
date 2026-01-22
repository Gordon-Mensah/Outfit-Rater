// App.jsx - FIXED VERSION with visible action buttons
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
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
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
    // Check if user has exceeded limit
    if (!canRate()) {
      setError('You have used your 5 free ratings today.')
      return
    }
    
    if (!image) {
      setError('Please upload an image first')
      return
    }

    // Check if this is the last free rating
    if (!isPremium && dailyRatingCount === 4) {
      // Show warning modal for last rating
      setPendingRatingAction('rate')
      setShowLastRatingWarning(true)
      return
    }

    // Proceed with rating
    await executeRating()
  }

  const executeRating = async () => {
    setLoading(true)
    setError(null)
    try {
      const base64Image = await readFileAsBase64(image)
      const response = await fetch(`${API_BASE_URL}/api/rate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, occasion, mode: feedbackMode, userId: user.id })
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
        state: { rating: data.rating, feedback: data.feedback, imagePreview: imagePreview, occasion: occasion }
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

    // Check if this is the last free rating
    if (!isPremium && dailyRatingCount === 4) {
      // Show warning modal for last rating
      setPendingRatingAction('compare')
      setShowLastRatingWarning(true)
      return
    }

    // Proceed with comparison
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
      const response = await fetch(`${API_BASE_URL}/api/compare-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images, occasion, userId: user.id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to compare')
      
      await checkDailyRatings(user.id)
      
      navigate('/compare-result', {
        state: {
          ratings: data.ratings,
          bestIndex: data.bestIndex,
          analysis: data.analysis,
          mixSuggestion: data.mixSuggestion,
          images: comparisonPreviews,
          occasion: occasion
        }
      })
    } catch (err) {
      console.error('Error comparing:', err)
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

  // Main App Content (Rate Outfit Interface)
  const MainAppContent = () => (
    <div className="app">
      {/* Last Rating Warning Modal */}
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
        {/* ========== ACTION BUTTONS - AT THE VERY TOP ========== */}
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
        </div>

        {/* MODE TOGGLE */}
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

        {/* FEEDBACK MODE (Premium only, Single mode only) */}
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

        {/* SAVED OUTFITS MODAL */}
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

        {/* HISTORY MODAL */}
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

        {/* ========== SINGLE MODE ========== */}
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

        {/* ========== COMPARISON MODE ========== */}
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
      {/* PUBLIC ROUTES - Show to non-logged-in users */}
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

      {/* PROTECTED ROUTES - Require login */}
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

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App