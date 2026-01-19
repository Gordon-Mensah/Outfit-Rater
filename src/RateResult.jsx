// RateResult.jsx - Updated with image sharing
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import SimpleUpgradeButton from './SimpleUpgradeButton'
import FloatingChatBubble from './FloatingChatBubble'

function RateResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const { rating, feedback, imagePreview, occasion } = location.state || {}

  if (!rating || !feedback) {
    return (
      <div className="result-page">
        <div className="result-container">
          <p style={{ color: 'white', textAlign: 'center' }}>No results to display</p>
          <button onClick={() => navigate('/')} className="btn-secondary-action">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  const getRatingLabel = (rating) => {
    if (rating >= 9) return 'Outstanding! 🔥'
    if (rating >= 7) return 'Great Look! ✨'
    if (rating >= 5) return 'Good Effort! 👍'
    return 'Room to Improve 💪'
  }

  const handleSaveOutfit = async () => {
    setSaving(true)
    setSaveMessage('')
    
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .insert({
          user_id: user.id,
          name: `${occasion} outfit`,
          image_data: imagePreview,
          rating: rating,
          occasion: occasion,
          created_at: new Date().toISOString()
        })
      
      if (error) throw error
      setSaveMessage('✓ Outfit saved successfully!')
    } catch (err) {
      console.error('Error saving outfit:', err)
      setSaveMessage('✗ Failed to save outfit')
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    try {
      // Convert base64 image to blob
      const base64Response = await fetch(imagePreview)
      const blob = await base64Response.blob()
      const file = new File([blob], 'my-outfit.jpg', { type: 'image/jpeg' })

      // Try to share with image
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Outfit Rating',
          text: `I got a ${rating}/10 on my ${occasion} outfit! 🔥`,
          files: [file]
        })
      } else if (navigator.share) {
        // Fallback: share without image but with preview in text
        await navigator.share({
          title: 'My Outfit Rating',
          text: `I got a ${rating}/10 on my ${occasion} outfit! Check it out at ${window.location.origin}`,
          url: window.location.origin
        })
      } else {
        // Desktop fallback: copy shareable text
        const shareText = `I got a ${rating}/10 on my ${occasion} outfit! 🔥\n\nCheck out AI Outfit Rater at ${window.location.origin}`
        await navigator.clipboard.writeText(shareText)
        alert('✓ Share text copied to clipboard!')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err)
        alert('Unable to share. Try the screenshot instead!')
      }
    }
  }

  return (
    <div className="result-page">
      <div className="result-container">
        {/* Header */}
        <div className="result-header-section">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="header">
            <h1>Your Outfit Rating</h1>
            <HamburgerMenu />
          </div>
          <p className="subtitle">AI analysis complete</p>
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

          {/* Image */}
          {imagePreview && (
            <div className="result-image-container">
              <img 
                src={imagePreview} 
                alt="Your outfit" 
                className="result-outfit-image"
              />
              <span className="occasion-badge">
                {occasion === 'none' ? 'General' : occasion}
              </span>
            </div>
          )}

          {/* Feedback */}
          <div className="feedback-section">
            <h3>💬 Detailed Feedback</h3>
            <div className="feedback-content">
              <p>{feedback}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="result-actions">
            <button 
              onClick={handleSaveOutfit} 
              disabled={saving}
              className="btn-action btn-save"
            >
              {saving ? '💾 Saving...' : saveMessage || '💾 Save Outfit'}
            </button>
            <button 
              onClick={handleShare}
              className="btn-action btn-share"
            >
              📤 Share Result
            </button>
            <button 
              onClick={() => navigate('/')}
              className="btn-action btn-reset"
            >
              ➕ Rate Another
            </button>
          </div>
        </div>

        {/* Show upgrade button only for non-premium users */}
        {!isPremium && (
          <div className="upgrade-section">
            <div className="upgrade-card">
              <h3>🎨 Unlock Style Chat</h3>
              <p>Get personalized style advice with our AI chat feature</p>
              <SimpleUpgradeButton 
                text="Upgrade to Premium - $5.99/month"
                billingCycle="monthly"
                className="btn-upgrade"
              />
            </div>
          </div>
        )}

        {/* Style Tips */}
        <div className="tips-section">
          <h3>💡 Quick Style Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>Color Harmony</h4>
              <p>Match colors using the color wheel - complementary colors create bold looks</p>
            </div>
            <div className="tip-card">
              <h4>Fit Matters</h4>
              <p>Well-fitted clothes always look better than expensive but ill-fitting ones</p>
            </div>
            <div className="tip-card">
              <h4>Accessories</h4>
              <p>The right accessories can elevate a simple outfit to extraordinary</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Bubble */}
      <FloatingChatBubble 
        outfitData={{
          rating,
          feedback,
          occasion,
          imagePreview
        }}
      />
    </div>
  )
}

export default RateResult