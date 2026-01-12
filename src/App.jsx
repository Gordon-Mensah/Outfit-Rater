// App.jsx - Optimized for Performance
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  const [showLastRatingWarning, setShowLastRatingWarning] = useState(false)
  const [pendingRatingAction, setPendingRatingAction] = useState(null)

  // ========== KEEP-WARM PING: Prevents API cold starts ==========
  useEffect(() => {
    if (!user) return

    // Ping API every 5 minutes to keep it warm
    const keepWarm = setInterval(async () => {
      try {
        await fetch(`${API_BASE_URL}/api/ping`, { method: 'GET' })
        console.log('🔥 API kept warm')
      } catch (err) {
        console.log('❌ Ping failed:', err)
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Initial ping on app load
    fetch(`${API_BASE_URL}/api/ping`, { method: 'GET' })
      .then(() => console.log('🔥 Initial ping successful'))
      .catch(() => console.log('❌ Initial ping failed'))

    return () => clearInterval(keepWarm)
  }, [user])
  // ========== END KEEP-WARM PING ==========

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // OPTIMIZED: More aggressive image compression
  const handleImageChange = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      // PERFORMANCE FIX: Reduced size from 1MB to 300KB and resolution from 1920 to 1024
      const options = { 
        maxSizeMB: 0.3,           // Much smaller file size
        maxWidthOrHeight: 1024,    // Lower resolution
        useWebWorker: true,
        initialQuality: 0.7        // Optimize quality
      }
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
  }, [])

  // OPTIMIZED: Compress comparison images
  const handleComparisonImages = useCallback(async (e) => {
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
      
      // PERFORMANCE FIX: Better compression settings
      const options = { 
        maxSizeMB: 0.3, 
        maxWidthOrHeight: 1024, 
        useWebWorker: true,
        initialQuality: 0.7
      }
      
      for (const file of files) {
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
  }, [])

  const readFileAsBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  const rateOutfit = useCallback(async () => {
    // Check if user has exceeded limit
    if (!canRate()) {
      setError('You have used your 3 free ratings today.')
      return
    }
    
    if (!image) {
      setError('Please upload an image first')
      return
    }

    // Check if this is the last free rating
    if (!isPremium && dailyRatingCount === 2) {
      setPendingRatingAction('rate')
      setShowLastRatingWarning(true)
      return
    }

    // Proceed with rating
    await executeRating()
  }, [canRate, image, isPremium, dailyRatingCount])

  const executeRating = useCallback(async () => {
    setLoading(true)
    setError(null)
    setShowLastRatingWarning(false)
    setPendingRatingAction(null)
    
    try {
      const base64Image = await readFileAsBase64(image)
      const response = await fetch(`${API_BASE_URL}/api/rate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image, 
          occasion, 
          mode: feedbackMode, 
          userId: user.id 
        })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to rate outfit')
      
      // Save to history
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
          occasion: occasion 
        }
      })
    } catch (err) {
      console.error('Error rating outfit:', err)
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [image, occasion, feedbackMode, user, imagePreview, readFileAsBase64, checkDailyRatings, navigate])

  const compareOutfits = useCallback(async () => {
    console.log('🔍 Compare button clicked')
    
    if (!canRate()) {
      setError('You have used your 3 free ratings today.')
      return
    }
    
    if (comparisonImages.length < 2) {
      setError('Please upload at least 2 images')
      return
    }

    // Check if this is the last free rating
    if (!isPremium && dailyRatingCount === 2) {
      setPendingRatingAction('compare')
      setShowLastRatingWarning(true)
      return
    }

    // Proceed with comparison
    await executeComparison()
  }, [canRate, comparisonImages, isPremium, dailyRatingCount])

  const executeComparison = useCallback(async () => {
    setLoading(true)
    setError(null)
    setShowLastRatingWarning(false)
    setPendingRatingAction(null)
    
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
        body: JSON.stringify({ 
          images: base64Images, 
          occasion, 
          userId: user.id 
        })
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
  }, [comparisonImages, occasion, user, comparisonPreviews, checkDailyRatings, navigate])

  // OPTIMIZED: Memoize rating color calculation
  const getRatingColor = useCallback((rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }, [])

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
      <Route path="/result" element={user ? <RateResult /> : <Navigate to="/login" />} />
      <Route path="/compare-result" element={user ? <CompareResult /> : <Navigate to="/login" />} />
      <Route path="/profile" element={user ? <ProfileSettings /> : <Navigate to="/login" />} />
      <Route path="/history" element={user ? <RatingHistory /> : <Navigate to="/login" />} />
      <Route path="/saved-outfits" element={user ? <SavedOutfits /> : <Navigate to="/login" />} />
      
      <Route path="/" element={
        !user ? <Navigate to="/login" /> : (
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

              {/* ACTION BUTTONS */}
              <div className="action-buttons">
                <button onClick={() => navigate('/history')} className="btn-secondary">
                  View History
                </button>
                <button onClick={() => navigate('/saved-outfits')} className="btn-secondary">
                  Saved Outfits
                </button>
              </div>

              {/* ========== SINGLE MODE ========== */}
              {!comparisonMode && (
                <div>
                  <div className="upload-zone">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      id="file-upload" 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="file-upload" className="upload-label">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="image-preview"
                          loading="lazy"
                        />
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
                      <li>Select 2-5 outfit photos (hold Ctrl/Cmd)</li>
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
                          <img 
                            src={preview} 
                            alt={`Outfit ${index + 1}`}
                            loading="lazy"
                          />
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
      } />
    </Routes>
  )
}

export default App