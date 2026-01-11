// LastRatingWarning.jsx - Warning modal when user has 1 rating left
import { useNavigate } from 'react-router-dom'

function LastRatingWarning({ isOpen, onClose, onContinue }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleUpgrade = () => {
    alert('Premium coming soon! Only $4.99/month for unlimited ratings.')
    onClose()
  }

  return (
    <div className="warning-overlay" onClick={onClose}>
      <div className="warning-modal" onClick={(e) => e.stopPropagation()}>
        <div className="warning-icon">⚠️</div>
        
        <h2 className="warning-title">Last Free Rating!</h2>
        
        <p className="warning-message">
          You're about to use your <strong>last free rating</strong> for today.
          After this, you'll need to wait until tomorrow or upgrade to Premium.
        </p>

        <div className="warning-features">
          <h3>🌟 Upgrade to Premium</h3>
          <ul>
            <li>✅ <strong>Unlimited</strong> outfit ratings per day</li>
            <li>✅ <strong>Unlimited</strong> saved outfits</li>
            <li>✅ All feedback modes (Helpful, Honest, Roast)</li>
            <li>✅ Compare up to 5 outfits at once</li>
            <li>✅ Priority support</li>
          </ul>
          <div className="warning-price">
            <span className="price-amount">$4.99</span>
            <span className="price-period">/month</span>
          </div>
        </div>

        <div className="warning-actions">
          <button 
            className="btn-warning-upgrade"
            onClick={handleUpgrade}
          >
            ⭐ Upgrade to Premium
          </button>
          <button 
            className="btn-warning-continue"
            onClick={() => {
              onContinue()
              onClose()
            }}
          >
            Use Last Free Rating
          </button>
          <button 
            className="btn-warning-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default LastRatingWarning