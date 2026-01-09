import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import imageCompression from 'browser-image-compression'
import Login from './Login'
import SignUp from './SignUp'

function App() {
  const { user, signOut, isPremium, canRate, dailyRatingCount, checkDailyRatings, loading } = useAuth()
  const navigate = useNavigate()

  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [occasion, setOccasion] = useState('none')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
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
  const [comparisonResult, setComparisonResult] = useState(null)

  // CRITICAL: Show simple loading while auth checks
  if (loading) {
    console.log('🔄 App.jsx: Still loading auth...')
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  console.log('✅ App.jsx: Loading complete. User:', user?.email || 'Not logged in')

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

  const saveOutfit = async () => {
    if (!user || !result) return
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
      setResult(null)
      setError(null)
    } catch (err) {
      console.error('Error compressing image:', err)
      setError('Failed to process image. Please try another one.')
    }
  }

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
      setComparisonImages(compressedFiles)
      setComparisonPreviews(previews)
      setComparisonResult(null)
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

  const rateOutfit = async () => {
    if (!canRate()) {
      setError('You have used your 3 free ratings today. Upgrade to Premium for unlimited ratings.')
      return
    }
    if (!image) {
      setError('Please upload an image first')
      return
    }
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const compareOutfits = async () => {
    if (!canRate()) {
      setError('You have used your 3 free ratings today. Upgrade to Premium for unlimited ratings.')
      return
    }
    if (comparisonImages.length < 2) {
      setError('Please upload at least 2 images to compare')
      return
    }
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

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

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

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

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
      <Route path="/" element={
        !user ? <Navigate to="/login" /> : (
          <div className="app">
            <div className="header">
              <h1>AI Outfit Rater</h1>
              <div className="header-right">
                <span className="user-email">{user.email}</span>
                {isPremium ? (
                  <span className="premium-badge">Premium</span>
                ) : (
                  <span className="free-tier">Free: {dailyRatingCount}/3 ratings today</span>
                )}
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </div>
            </div>
            <div className="container">
              <div className="mode-toggle">
                <button className={!comparisonMode ? 'active' : ''} onClick={() => { setComparisonMode(false); reset(); }}>
                  Single Outfit
                </button>
                <button className={comparisonMode ? 'active' : ''} onClick={() => { setComparisonMode(true); reset(); }}>
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
              <div className="action-buttons">
                <button onClick={loadHistory} className="btn-secondary">View History</button>
                <button onClick={loadSavedOutfits} className="btn-secondary">Saved Outfits ({savedCount}{!isPremium ? '/10' : ''})</button>
              </div>

              {/* Rest of your UI stays the same - just showing the critical part */}
              {!comparisonMode && !result && (
                <>
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
                    <input type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} id="camera-capture" style={{ display: 'none' }} />
                    <label htmlFor="camera-capture" className="btn-camera">Take Photo</label>
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
                  <button onClick={rateOutfit} disabled={!image || isLoading} className="btn-rate">
                    {isLoading ? (<><span className="spinner"></span>Rating your outfit...</>) : ('Rate My Outfit')}
                  </button>
                </>
              )}

              {result && !comparisonMode && (
                <div className="result">
                  <div className="result-header">
                    <h2>Your Outfit Rating</h2>
                    <div className="rating-score" style={{ color: getRatingColor(result.rating) }}>{result.rating}/10</div>
                  </div>
                  {imagePreview && <img src={imagePreview} alt="Rated outfit" className="result-image" />}
                  <div className="feedback"><p>{result.feedback}</p></div>
                  <div className="result-actions">
                    <button onClick={saveOutfit} className="btn-save">Save Outfit</button>
                    <button onClick={shareResult} className="btn-share">Share Result</button>
                    <button onClick={reset} className="btn-reset">Rate Another</button>
                  </div>
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