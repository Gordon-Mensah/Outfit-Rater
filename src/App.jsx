// Main App Component
// Fixed: Compare mode now works for all users (within daily limits)

import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import imageCompression from 'browser-image-compression'
import Login from './Login'
import SignUp from './SignUp'
import RateResult from './RateResult'
import CompareResult from './CompareResult'

// API Base URL - automatically uses same domain in production
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function App() {
  const { user, signOut, isPremium, canRate, dailyRatingCount, checkDailyRatings, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [occasion, setOccasion] = useState('none')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [feedbackMode, setFeedbackMode] = useState('helpful')
  const [showHistory, setShowHistory] = useState(false)
  const [outfitHistory, setOutfitHistory] = useState([])
  
  const [showSavedOutfits, setShowSavedOutfits] = useState(false)
  const [savedOutfits, setSavedOutfits] = useState([])
  const [savedCount, setSavedCount] = useState(0)
  
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonImages, setComparisonImages] = useState([])
  const [comparisonPreviews, setComparisonPreviews] = useState([])

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
      console.log('Compressing image...')
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      
      const compressedFile = await imageCompression(file, options)
      console.log('Compressed! Original:', file.size, 'New:', compressedFile.size)
      
      setImage(compressedFile)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(compressedFile)
      
      setError(null)
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('Failed to process image. Please try another one.')
    }
  }

  const handleComparisonImages = async (e) => {
    const files = Array.from(e.target.files)
    
    console.log('📸 Files selected:', files.length)
    
    if (files.length < 2) {
      setError('Please select at least 2 images to compare')
      return
    }
    if (files.length > 5) {
      setError('You can compare up to 5 outfits at once')
      return
    }

    try {
      console.log('🔄 Compressing images...')
      const compressedFiles = []
      const previews = []

      for (const file of files) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        }
        
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
      setError('Failed to process images. Please try again.')
    }
  }

  const handleCameraCapture = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    e.target.files = { 0: file, length: 1 }
    handleImageChange(e)
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
      setError('You have used your 3 free ratings today. Upgrade to Premium for unlimited ratings.')
      return
    }

    if (!image) {
      setError('Please upload an image first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const base64Image = await readFileAsBase64(image)

      console.log('🤖 Calling rate-outfit API...')
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rate outfit')
      }

      console.log('✅ Rating received:', data.rating)

      // Save to history
      if (user) {
        await supabase.from('outfit_history').insert({
          user_id: user.id,
          rating: data.rating,
          feedback: data.feedback,
          occasion: occasion,
          created_at: new Date().toISOString()
        })

        await checkDailyRatings(user.id)
      }

      // Navigate to result page
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
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const compareOutfits = async () => {
    console.log('🔍 Compare button clicked')
    console.log('📊 Images:', comparisonImages.length)
    console.log('🎫 Can rate:', canRate())
    
    if (!canRate()) {
      setError('You have used your 3 free ratings today. Upgrade to Premium for unlimited ratings.')
      return
    }

    if (comparisonImages.length < 2) {
      setError('Please upload at least 2 images to compare')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('📸 Converting images to base64...')
      const base64Images = await Promise.all(
        comparisonImages.map(img => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(img)
          })
        })
      )

      console.log('🚀 Calling compare-outfits API...')
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

      if (!response.ok) {
        console.error('❌ API error:', data)
        throw new Error(data.error || 'Failed to compare outfits')
      }

      console.log('✅ Comparison received:', data)

      await checkDailyRatings(user.id)

      // Navigate to compare result page
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
      console.error('❌ Error comparing outfits:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setImage(null)
    setImagePreview(null)
    setOccasion('none')
    setError(null)
    setComparisonMode(false)
    setComparisonImages([])
    setComparisonPreviews([])
  }

  const handleLogout = async () => {
    console.log('🚪 Logout clicked')
    localStorage.clear()
    sessionStorage.clear()
    supabase.auth.signOut().catch(() => {})
    window.location.reload()
  }

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <Routes>
      {/* LOGIN PAGE */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <Login />} 
      />
      
      {/* SIGNUP PAGE */}
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/" /> : <SignUp />} 
      />
      
      {/* RATE RESULT PAGE */}
      <Route 
        path="/result" 
        element={user ? <RateResult /> : <Navigate to="/login" />} 
      />
      
      {/* COMPARE RESULT PAGE */}
      <Route 
        path="/compare-result" 
        element={user ? <CompareResult /> : <Navigate to="/login" />} 
      />
      
      {/* MAIN APP */}
      <Route 
        path="/" 
        element={
          !user ? <Navigate to="/login" /> : (
            <div className="app">
              <div className="header">
                <h1>AI Outfit Rater</h1>
                <div className="header-right">
                  <span className="user-email">{user.email}</span>
                  
                  {isPremium ? (
                    <span className="premium-badge">Premium</span>
                  ) : (
                    <span className="free-tier">
                      Free: {dailyRatingCount}/1000 ratings today
                    </span>
                  )}
                  
                  <button onClick={handleLogout} className="btn-logout">
                    Logout
                  </button>
                </div>
              </div>

              <div className="container">
                {/* MODE TOGGLE - WORKS FOR EVERYONE */}
                <div className="mode-toggle">
                  <button
                    className={!comparisonMode ? 'active' : ''}
                    onClick={() => { 
                      console.log('Switching to single mode')
                      setComparisonMode(false)
                      reset()
                    }}
                  >
                    Single Outfit
                  </button>
                  <button
                    className={comparisonMode ? 'active' : ''}
                    onClick={() => { 
                      console.log('Switching to compare mode')
                      setComparisonMode(true)
                      reset()
                    }}
                  >
                    Compare Outfits
                  </button>
                </div>

                {/* FEEDBACK MODE SELECTOR (Premium only) */}
                {isPremium && !comparisonMode && (
                  <div className="mode-selector">
                    <label>Feedback Style:</label>
                    <div className="mode-buttons">
                      <button
                        className={feedbackMode === 'helpful' ? 'active' : ''}
                        onClick={() => setFeedbackMode('helpful')}
                      >
                        Helpful
                      </button>
                      <button
                        className={feedbackMode === 'honest' ? 'active' : ''}
                        onClick={() => setFeedbackMode('honest')}
                      >
                        Honest
                      </button>
                      <button
                        className={feedbackMode === 'roast' ? 'active' : ''}
                        onClick={() => setFeedbackMode('roast')}
                      >
                        Roast Mode
                      </button>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="action-buttons">
                  <button onClick={loadHistory} className="btn-secondary">
                    View History
                  </button>
                  <button onClick={loadSavedOutfits} className="btn-secondary">
                    Saved Outfits ({savedCount}{!isPremium ? '/10' : ''})
                  </button>
                </div>

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
                          <p className="empty-message">No saved outfits yet. Save your favorite looks!</p>
                        ) : (
                          savedOutfits.map((outfit) => (
                            <div key={outfit.id} className="saved-outfit-card">
                              <img src={outfit.image_data} alt={outfit.name} />
                              <div className="saved-outfit-info">
                                <h3>{outfit.name}</h3>
                                <p className="rating" style={{ color: getRatingColor(outfit.rating) }}>
                                  {outfit.rating}/10
                                </p>
                                <p className="occasion">{outfit.occasion}</p>
                                <p className="date">{new Date(outfit.created_at).toLocaleDateString()}</p>
                                <button
                                  onClick={() => deleteSavedOutfit(outfit.id)}
                                  className="btn-delete"
                                >
                                  Delete
                                </button>
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
                          <p className="empty-message">No ratings yet. Rate your first outfit!</p>
                        ) : (
                          outfitHistory.map((item) => (
                            <div key={item.id} className="history-item">
                              <div className="history-rating">
                                <span style={{ color: getRatingColor(item.rating) }}>
                                  {item.rating}/10
                                </span>
                              </div>
                              <div className="history-details">
                                <p className="history-occasion">{item.occasion}</p>
                                <p className="history-date">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                                <p className="history-feedback">{item.feedback.substring(0, 100)}...</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SINGLE OUTFIT MODE */}
                {!comparisonMode && (
                  <>
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
                          <img src={imagePreview} alt="Preview" className="image-preview" />
                        ) : (
                          <>
                            <div className="upload-icon">+</div>
                            <p>Click to upload outfit photo</p>
                          </>
                        )}
                      </label>

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        id="camera-capture"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="camera-capture" className="btn-camera">
                        Take Photo
                      </label>
                    </div>

                    <div className="occasion-selector">
                      <label htmlFor="occasion">Occasion:</label>
                      <select
                        id="occasion"
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                      >
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
                      onClick={rateOutfit}
                      disabled={!image || loading}
                      className="btn-rate"
                    >
                      {loading ? (
                        <>
                          <span className="spinner"></span>
                          Rating your outfit...
                        </>
                      ) : (
                        'Rate My Outfit'
                      )}
                    </button>
                  </>
                )}

                {/* COMPARISON MODE */}
                {comparisonMode && (
                  <>
                    {/* Instructions for comparison mode */}
                    <div className="comparison-instructions">
                      <h4>How to Compare Outfits:</h4>
                      <ul>
                        <li>Click the upload area below</li>
                        <li>Select 2-5 outfit photos at once (hold Ctrl/Cmd to select multiple)</li>
                        <li>Wait for all images to upload</li>
                        <li>Click "Compare Outfits" button</li>
                      </ul>
                    </div>

                    <div className="comparison-upload comparison-mode">
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
                        <small>💡 Hold Ctrl/Cmd to select multiple files</small>
                      </label>
                    </div>

                    {comparisonPreviews.length > 0 && (
                      <div className="comparison-preview-grid">
                        {comparisonPreviews.map((preview, index) => (
                          <div 
                            key={index} 
                            className="comparison-preview-item"
                            data-index={index + 1}
                          >
                            <img src={preview} alt={`Outfit ${index + 1}`} />
                            <p>Outfit {index + 1}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="occasion-selector">
                      <label htmlFor="occasion">Occasion:</label>
                      <select
                        id="occasion"
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                      >
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
                          Comparing outfits...
                        </>
                      ) : (
                        'Compare Outfits'
                      )}
                    </button>
                  </>
                )}

                {/* UPGRADE PROMPT */}
                {!isPremium && (
                  <div className="upgrade-prompt">
                    <h3>Upgrade to Premium</h3>
                    <ul>
                      <li>Unlimited ratings</li>
                      <li>Unlimited saved outfits</li>
                      <li>All feedback modes (Helpful, Honest, Roast)</li>
                      <li>Priority support</li>
                    </ul>
                    <p className="price">Only $4.99/month</p>
                    <button 
                      className="btn-upgrade"
                      onClick={() => alert('Premium coming soon! We are setting up payments. Check back soon!')}
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        } 
      />
    </Routes>
  )
}

export default App