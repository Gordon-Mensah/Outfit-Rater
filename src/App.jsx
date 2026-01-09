// 📚 WHAT IS THIS FILE?
// This is your MAIN APP component - the heart of your outfit rater!
// It handles:
// - Routing (which page to show)
// - Image upload and rating
// - Premium features
// - Outfit history

import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import imageCompression from 'browser-image-compression'
import Login from './Login'
import SignUp from './SignUp'

function App() {
  // 🎣 GET AUTH DATA
  const { user, signOut, isPremium, canRate, dailyRatingCount, checkDailyRatings } = useAuth()
  const navigate = useNavigate()

  // 📝 STATE FOR MAIN APP
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [occasion, setOccasion] = useState('none')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  // 🎭 NEW STATE FOR PREMIUM FEATURES
  const [feedbackMode, setFeedbackMode] = useState('helpful') // 'helpful', 'honest', 'roast'
  const [showHistory, setShowHistory] = useState(false)
  const [outfitHistory, setOutfitHistory] = useState([])

  // 📊 FUNCTION: Load outfit history from database
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

  // 🖼️ FUNCTION: Handle image selection
  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      // COMPRESS the image to save bandwidth and API costs
      console.log('📦 Compressing image...')
      const options = {
        maxSizeMB: 1,          // Max 1MB
        maxWidthOrHeight: 1920, // Max 1920px
        useWebWorker: true      // Faster compression
      }
      
      const compressedFile = await imageCompression(file, options)
      console.log('✅ Compressed! Original:', file.size, 'New:', compressedFile.size)
      
      setImage(compressedFile)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(compressedFile)
      
      // Clear previous result
      setResult(null)
      setError(null)
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('Failed to process image. Please try another one.')
    }
  }

  // 📸 FUNCTION: Handle camera capture (mobile)
  const handleCameraCapture = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Reuse the same logic as image upload
    e.target.files = { 0: file, length: 1 }
    handleImageChange(e)
  }

  // 🎬 FUNCTION: Rate the outfit
  const rateOutfit = async () => {
    // Check if user can rate (premium = unlimited, free = 3/day)
    if (!canRate()) {
      setError('😅 You\'ve used your 3 free ratings today! Upgrade to Premium for unlimited ratings.')
      return
    }

    if (!image) {
      setError('Please upload an image first!')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.readAsDataURL(image)
      
      reader.onloadend = async () => {
        const base64Image = reader.result

        // Call our API
        const response = await fetch('/api/rate-outfit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            occasion,
            mode: feedbackMode, // NEW: Include feedback mode
            userId: user.id     // NEW: Include user ID
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to rate outfit')
        }

        // Save to database
        if (user) {
          await supabase.from('outfit_history').insert({
            user_id: user.id,
            rating: data.rating,
            feedback: data.feedback,
            occasion: occasion,
            created_at: new Date().toISOString()
          })

          // Refresh daily count
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

  // 🔄 FUNCTION: Reset everything
  const reset = () => {
    setImage(null)
    setImagePreview(null)
    setOccasion('none')
    setResult(null)
    setError(null)
  }

  // 🚪 FUNCTION: Handle logout
  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // 🎨 FUNCTION: Get rating color
  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6' // Purple
    if (rating >= 7) return '#10b981' // Green
    if (rating >= 4) return '#f59e0b' // Yellow
    return '#ef4444'                   // Red
  }

  // 🎨 FUNCTION: Get rating emoji
  const getRatingEmoji = (rating) => {
    if (rating >= 9) return '🔥'
    if (rating >= 7) return '😊'
    if (rating >= 4) return '😐'
    return '😬'
  }

  // 📱 FUNCTION: Share result
  const shareResult = () => {
    const text = `I got a ${result.rating}/10 on my outfit! 👕✨`
    const url = window.location.href

    if (navigator.share) {
      navigator.share({ title: 'My Outfit Rating', text, url })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      alert('Rating copied to clipboard!')
    }
  }

  // 🛣️ ROUTING: Show different pages based on URL
  return (
    <Routes>
      {/* LOGIN PAGE: /login */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <Login />} 
      />
      
      {/* SIGNUP PAGE: /signup */}
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/" /> : <SignUp />} 
      />
      
      {/* MAIN APP: / */}
      <Route 
        path="/" 
        element={
          // If not logged in, redirect to login
          !user ? <Navigate to="/login" /> : (
            <div className="app">
              {/* 🎯 HEADER */}
              <div className="header">
                <h1>👕 AI Outfit Rater</h1>
                <div className="header-right">
                  {/* Show user email */}
                  <span className="user-email">{user.email}</span>
                  
                  {/* Show premium badge or free tier info */}
                  {isPremium ? (
                    <span className="premium-badge">⭐ Premium</span>
                  ) : (
                    <span className="free-tier">
                      Free: {dailyRatingCount}/3 ratings today
                    </span>
                  )}
                  
                  {/* Logout button */}
                  <button onClick={handleLogout} className="btn-logout">
                    Logout
                  </button>
                </div>
              </div>

              <div className="container">
                {/* 🎭 FEEDBACK MODE SELECTOR (Premium Feature) */}
                {isPremium && (
                  <div className="mode-selector">
                    <label>Feedback Style:</label>
                    <div className="mode-buttons">
                      <button
                        className={feedbackMode === 'helpful' ? 'active' : ''}
                        onClick={() => setFeedbackMode('helpful')}
                      >
                        😊 Helpful
                      </button>
                      <button
                        className={feedbackMode === 'honest' ? 'active' : ''}
                        onClick={() => setFeedbackMode('honest')}
                      >
                        🤔 Honest
                      </button>
                      <button
                        className={feedbackMode === 'roast' ? 'active' : ''}
                        onClick={() => setFeedbackMode('roast')}
                      >
                        🔥 Roast Mode
                      </button>
                    </div>
                  </div>
                )}

                {/* 📜 HISTORY BUTTON */}
                <div className="history-toggle">
                  <button onClick={loadHistory} className="btn-history">
                    📜 View History
                  </button>
                </div>

                {/* 📜 HISTORY VIEW */}
                {showHistory && (
                  <div className="history-modal">
                    <div className="history-content">
                      <div className="history-header">
                        <h2>Your Outfit History</h2>
                        <button onClick={() => setShowHistory(false)}>✕</button>
                      </div>
                      <div className="history-list">
                        {outfitHistory.length === 0 ? (
                          <p className="empty-history">No ratings yet. Rate your first outfit!</p>
                        ) : (
                          outfitHistory.map((item) => (
                            <div key={item.id} className="history-item">
                              <div className="history-rating">
                                <span style={{ color: getRatingColor(item.rating) }}>
                                  {item.rating}/10 {getRatingEmoji(item.rating)}
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

                {/* 📤 UPLOAD SECTION */}
                {!result && (
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
                            <div className="upload-icon">📸</div>
                            <p>Click to upload outfit photo</p>
                          </>
                        )}
                      </label>

                      {/* Camera button for mobile */}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        id="camera-capture"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="camera-capture" className="btn-camera">
                        📷 Take Photo
                      </label>
                    </div>

                    {/* Occasion selector */}
                    <div className="occasion-selector">
                      <label htmlFor="occasion">What's the occasion?</label>
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

                    {/* Error message */}
                    {error && <div className="error">{error}</div>}

                    {/* Rate button */}
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

                {/* 🎯 RESULT SECTION */}
                {result && (
                  <div className="result">
                    <div className="result-header">
                      <h2>Your Outfit Rating</h2>
                      <div 
                        className="rating-score"
                        style={{ color: getRatingColor(result.rating) }}
                      >
                        {result.rating}/10 {getRatingEmoji(result.rating)}
                      </div>
                    </div>

                    {imagePreview && (
                      <img src={imagePreview} alt="Rated outfit" className="result-image" />
                    )}

                    <div className="feedback">
                      <p>{result.feedback}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="result-actions">
                      <button onClick={shareResult} className="btn-share">
                        📤 Share Result
                      </button>
                      <button onClick={reset} className="btn-reset">
                        Rate Another Outfit
                      </button>
                    </div>
                  </div>
                )}

                {/* 💎 UPGRADE PROMPT for free users */}
                {!isPremium && (
                  <div className="upgrade-prompt">
                    <h3>⭐ Upgrade to Premium</h3>
                    <ul>
                      <li>✅ Unlimited ratings</li>
                      <li>✅ Roast mode</li>
                      <li>✅ Save outfit history</li>
                      <li>✅ Detailed breakdowns</li>
                    </ul>
                    <p className="price">Only $4.99/month</p>
                    <button 
                      className="btn-upgrade"
                      onClick={() => alert('💎 Premium coming soon! We\'re setting up payments. Check back soon!')}
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

// 📖 HOW THIS ALL WORKS TOGETHER:
//
// 1. User visits website → main.jsx loads
// 2. AuthProvider checks if user is logged in
// 3. If not logged in → Show /login page
// 4. User logs in → AuthContext updates user state
// 5. App.jsx sees user is logged in → Shows main app
// 6. User uploads image → handleImageChange compresses it
// 7. User clicks "Rate" → rateOutfit sends to API
// 8. API returns rating → Save to database
// 9. Show result → User can share or rate another
// 10. User clicks history → Load from database
// 11. Premium users get extra features automatically