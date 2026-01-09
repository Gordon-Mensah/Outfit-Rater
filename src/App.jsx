// Main App Component
// Handles routing, outfit rating, saving, and comparison features

import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import imageCompression from 'browser-image-compression'
import Login from './Login'
import SignUp from './SignUp'

function App() {
  // Auth data - ADDED loading state check
  const { user, signOut, isPremium, canRate, dailyRatingCount, checkDailyRatings, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Main app state
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [occasion, setOccasion] = useState('none')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  // Premium features
  const [feedbackMode, setFeedbackMode] = useState('helpful')
  const [showHistory, setShowHistory] = useState(false)
  const [outfitHistory, setOutfitHistory] = useState([])
  
  // Saved outfits feature
  const [showSavedOutfits, setShowSavedOutfits] = useState(false)
  const [savedOutfits, setSavedOutfits] = useState([])
  const [savedCount, setSavedCount] = useState(0)
  
  // Comparison feature
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonImages, setComparisonImages] = useState([])
  const [comparisonPreviews, setComparisonPreviews] = useState([])
  const [comparisonResult, setComparisonResult] = useState(null)

  // CRITICAL: Show loading screen while auth is checking
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Load outfit history
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

  // Load saved outfits
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

  // Save current outfit
  const saveOutfit = async () => {
    if (!user || !result) return

    // Check limits
    if (!isPremium && savedCount >= 10) {
      setError('You can only save 10 outfits on the free plan. Upgrade to Premium for unlimited saves.')
      return
    }

    try {
      const { error } = await supabase
        .from('saved_outfits')
        .insert({
          user_id: user.id,
          image_data: imagePreview,
          rating: result.rating,
          feedback: result.feedback,
          occasion: occasion,
          name: `Outfit ${savedCount + 1}`,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Outfit saved successfully!')
      setSavedCount(savedCount + 1)
    } catch (err) {
      console.error('Error saving outfit:', err)
      setError('Failed to save outfit. Please try again.')
    }
  }

  // Delete saved outfit
  const deleteSavedOutfit = async (outfitId) => {
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('id', outfitId)
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh list
      loadSavedOutfits()
    } catch (err) {
      console.error('Error deleting outfit:', err)
    }
  }

  // Handle single image selection
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
      
      setResult(null)
      setError(null)
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('Failed to process image. Please try another one.')
    }
  }

  // Handle multiple images for comparison
  const handleComparisonImages = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length < 2) {
      setError('Please select at least 2 images to compare')
      return
    }
    if (files.length > 5) {
      setError('You can compare up to 5 outfits at once')
      return
    }

    try {
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

      setComparisonImages(compressedFiles)
      setComparisonPreviews(previews)
      setComparisonResult(null)
      setError(null)
    } catch (err) {
      console.error('Error processing images:', err)
      setError('Failed to process images. Please try again.')
    }
  }

  // Handle camera capture
  const handleCameraCapture = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    e.target.files = { 0: file, length: 1 }
    handleImageChange(e)
  }

  // Rate single outfit
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
    setResult(null)

    try {
      const reader = new FileReader()
      reader.readAsDataURL(image)
      
      reader.onloadend = async () => {
        const base64Image = reader.result

        const response = await fetch('/api/rate-outfit', {
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

        setResult(data)
      }
    } catch (err) {
      console.error('Error rating outfit:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Compare multiple outfits
  const compareOutfits = async () => {
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
    setComparisonResult(null)

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

      const response = await fetch('/api/compare-outfits', {
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
        throw new Error(data.error || 'Failed to compare outfits')
      }

      setComparisonResult(data)
      await checkDailyRatings(user.id)
    } catch (err) {
      console.error('Error comparing outfits:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset everything
  const reset = () => {
    setImage(null)
    setImagePreview(null)
    setOccasion('none')
    setResult(null)
    setError(null)
    setComparisonMode(false)
    setComparisonImages([])
    setComparisonPreviews([])
    setComparisonResult(null)
  }

  // Handle logout - FIXED VERSION
  const handleLogout = async () => {
    console.log('🚪 Logout clicked')
    
    try {
      // Sign out via both methods
      await signOut()
      await supabase.auth.signOut()
      
      // Clear storage
      localStorage.clear()
      
      // Navigate
      navigate('/login')
      
      // Force reload as backup
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
      
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout anyway
      localStorage.clear()
      window.location.href = '/login'
    }
  }

  // Get rating color
  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  // Share result
  const shareResult = () => {
    const text = `I got a ${result.rating}/10 on my outfit!`
    const url = window.location.href

    if (navigator.share) {
      navigator.share({ title: 'My Outfit Rating', text, url })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      alert('Rating copied to clipboard!')
    }
  }

  // ROUTING
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
      
      {/* MAIN APP */}
      <Route 
        path="/" 
        element={
          !user ? <Navigate to="/login" /> : (
            <div className="app">
              {/* HEADER */}
              <div className="header">
                <h1>AI Outfit Rater</h1>
                <div className="header-right">
                  <span className="user-email">{user.email}</span>
                  
                  {isPremium ? (
                    <span className="premium-badge">Premium</span>
                  ) : (
                    <span className="free-tier">
                      Free: {dailyRatingCount}/3 ratings today
                    </span>
                  )}
                  
                  <button onClick={handleLogout} className="btn-logout">
                    Logout
                  </button>
                </div>
              </div>

              <div className="container">
                {/* MODE TOGGLE */}
                <div className="mode-toggle">
                  <button
                    className={!comparisonMode ? 'active' : ''}
                    onClick={() => { setComparisonMode(false); reset(); }}
                  >
                    Single Outfit
                  </button>
                  <button
                    className={comparisonMode ? 'active' : ''}
                    onClick={() => { setComparisonMode(true); reset(); }}
                  >
                    Compare Outfits
                  </button>
                </div>

                {/* FEEDBACK MODE SELECTOR (Premium) */}
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
                {!comparisonMode && !result && (
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
                {comparisonMode && !comparisonResult && (
                  <>
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
                        <small>Select multiple images at once</small>
                      </label>
                    </div>

                    {comparisonPreviews.length > 0 && (
                      <div className="comparison-preview-grid">
                        {comparisonPreviews.map((preview, index) => (
                          <div key={index} className="comparison-preview-item">
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
                      className="btn-rate"
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

                {/* SINGLE OUTFIT RESULT */}
                {result && !comparisonMode && (
                  <div className="result">
                    <div className="result-header">
                      <h2>Your Outfit Rating</h2>
                      <div 
                        className="rating-score"
                        style={{ color: getRatingColor(result.rating) }}
                      >
                        {result.rating}/10
                      </div>
                    </div>

                    {imagePreview && (
                      <img src={imagePreview} alt="Rated outfit" className="result-image" />
                    )}

                    <div className="feedback">
                      <p>{result.feedback}</p>
                    </div>

                    <div className="result-actions">
                      <button onClick={saveOutfit} className="btn-save">
                        Save Outfit
                      </button>
                      <button onClick={shareResult} className="btn-share">
                        Share Result
                      </button>
                      <button onClick={reset} className="btn-reset">
                        Rate Another
                      </button>
                    </div>
                  </div>
                )}

                {/* COMPARISON RESULT */}
                {comparisonResult && comparisonMode && (
                  <div className="result">
                    <div className="result-header">
                      <h2>Comparison Results</h2>
                    </div>

                    <div className="comparison-results">
                      <div className="best-outfit">
                        <h3>Best Choice</h3>
                        <img src={comparisonPreviews[comparisonResult.bestIndex]} alt="Best outfit" />
                        <p className="rating" style={{ color: getRatingColor(comparisonResult.ratings[comparisonResult.bestIndex]) }}>
                          {comparisonResult.ratings[comparisonResult.bestIndex]}/10
                        </p>
                      </div>

                      <div className="comparison-feedback">
                        <h3>Analysis</h3>
                        <p>{comparisonResult.analysis}</p>
                        
                        {comparisonResult.mixSuggestion && (
                          <div className="mix-suggestion">
                            <h4>Mix & Match Suggestion</h4>
                            <p>{comparisonResult.mixSuggestion}</p>
                          </div>
                        )}
                      </div>

                      <div className="all-ratings">
                        <h3>All Outfits</h3>
                        {comparisonResult.ratings.map((rating, index) => (
                          <div key={index} className="rating-item">
                            <img src={comparisonPreviews[index]} alt={`Outfit ${index + 1}`} />
                            <span style={{ color: getRatingColor(rating) }}>{rating}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="result-actions">
                      <button onClick={reset} className="btn-reset">
                        Compare More
                      </button>
                    </div>
                  </div>
                )}

                {/* UPGRADE PROMPT */}
                {!isPremium && (
                  <div className="upgrade-prompt">
                    <h3>Upgrade to Premium</h3>
                    <ul>
                      <li>Unlimited ratings</li>
                      <li>Unlimited saved outfits</li>
                      <li>Advanced comparison features</li>
                      <li>Roast mode</li>
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