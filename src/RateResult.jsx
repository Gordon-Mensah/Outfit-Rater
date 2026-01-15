// RateResult.jsx - Dedicated page for outfit rating results
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'

function RateResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  
  // Get result data from navigation state
  const { rating, feedback, imagePreview, occasion } = location.state || {}
  
  const [savedCount, setSavedCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // If no data, redirect back
  if (!rating || !feedback) {
    navigate('/')
    return null
  }

  // Get rating color based on score
  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  // Get rating label
  const getRatingLabel = (rating) => {
    if (rating >= 9) return 'Outstanding! 🔥'
    if (rating >= 7) return 'Great Choice! ✨'
    if (rating >= 5) return 'Good Effort! 👍'
    return 'Room for Improvement'
  }

  // Save outfit to collection
  const saveOutfit = async () => {
    if (!user) return

    // Check limits
    if (!isPremium && savedCount >= 10) {
      alert('You can only save 10 outfits on the free plan. Upgrade to Premium for unlimited saves!')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('saved_outfits')
        .insert({
          user_id: user.id,
          image_data: imagePreview,
          rating: rating,
          feedback: feedback,
          occasion: occasion || 'none',
          name: `Outfit ${savedCount + 1}`,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setSaveSuccess(true)
      setSavedCount(savedCount + 1)
      
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
      
    } catch (err) {
      console.error('Error saving outfit:', err)
      alert('Failed to save outfit. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Share result
  const shareResult = () => {
    const text = `I got a ${rating}/10 on my outfit! 🎉`
    const url = window.location.origin

    if (navigator.share) {
      navigator.share({ 
        title: 'My Outfit Rating',
        text: text,
        url: url
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${text} ${url}`)
        alert('Rating copied to clipboard!')
      })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      alert('Rating copied to clipboard!')
    }
  }

  // Download image with rating overlay
  const downloadResult = () => {
    // Create a canvas to combine image and rating
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height + 150 // Extra space for rating
      
      // Draw image
      ctx.drawImage(img, 0, 0)
      
      // Draw rating overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, img.height, canvas.width, 150)
      
      // Draw rating text
      ctx.fillStyle = getRatingColor(rating)
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${rating}/10`, canvas.width / 2, img.height + 60)
      
      ctx.fillStyle = 'white'
      ctx.font = '24px Arial'
      ctx.fillText('AI Outfit Rater', canvas.width / 2, img.height + 100)
      
      // Download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `outfit-rating-${rating}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    }
    
    img.src = imagePreview
  }

  return (
    <div className="result-page">
      <div className="result-container">
        {/* Header */}
        <div className="result-header-section">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Home
          </button>
          <h1>Your Outfit Rating</h1>
        </div>

        {/* Main Result Card */}
        <div className="result-card">
          {/* Rating Display */}
          <div className="rating-display">
            <div 
              className="rating-circle"
              style={{ borderColor: getRatingColor(rating) }}
            >
              <span 
                className="rating-number"
                style={{ color: getRatingColor(rating) }}
              >
                {rating}
              </span>
              <span className="rating-denominator">/10</span>
            </div>
            <h2 className="rating-label">{getRatingLabel(rating)}</h2>
          </div>

          {/* Image Display */}
          {imagePreview && (
            <div className="result-image-container">
              <img 
                src={imagePreview} 
                alt="Your outfit" 
                className="result-outfit-image"
              />
              {occasion && occasion !== 'none' && (
                <div className="occasion-badge">
                  📍 {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                </div>
              )}
            </div>
          )}

          {/* Feedback Section */}
          <div className="feedback-section">
            <h3>AI Feedback</h3>
            <div className="feedback-content">
              <p>{feedback}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="result-actions">
            <button 
              onClick={saveOutfit} 
              className="btn-action btn-save"
              disabled={saving || saveSuccess}
            >
              {saving ? (
                <>
                  <span className="button-spinner"></span>
                  Saving...
                </>
              ) : saveSuccess ? (
                <>✓ Saved!</>
              ) : (
                <>💾 Save Outfit</>
              )}
            </button>

            <button 
              onClick={shareResult} 
              className="btn-action btn-share"
            >
              📤 Share Result
            </button>

            <button 
              onClick={downloadResult} 
              className="btn-action btn-download"
            >
              ⬇️ Download
            </button>
          </div>

          {/* Additional Actions */}
          <div className="secondary-actions">
            <button 
              onClick={() => navigate('/', { state: { mode: 'single' } })} 
              className="btn-secondary-action"
            >
              Rate Another Outfit
            </button>
            <button 
              onClick={() => navigate('/', { state: { mode: 'compare' } })} 
              className="btn-secondary-action"
            >
              Compare Outfits
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h3>💡 Pro Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-icon">👕</span>
              <h4>Fit Matters</h4>
              <p>Well-fitted clothes always score higher</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🎨</span>
              <h4>Color Harmony</h4>
              <p>Complementary colors create balance</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">✨</span>
              <h4>Occasion Context</h4>
              <p>Always consider where you're going</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RateResult