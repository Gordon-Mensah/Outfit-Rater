// LastRatingWarning.jsx - Simplified with Direct Checkout
import SimpleUpgradeButton from './SimpleUpgradeButton'

function LastRatingWarning({ isOpen, onClose, onContinue }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="last-rating-modal" onClick={(e) => e.stopPropagation()}>
        
        <h2>This is Your Last Free Rating!</h2>
        
        <p className="modal-message">
          You've used 2 out of 3 free ratings today. After this rating, 
          you'll need to upgrade to Premium to continue.
        </p>

        <div className="premium-features-box">
          <h3>Premium includes:</h3>
          <ul>
            <li> Unlimited daily ratings</li>
            <li> AI Style Chat with personalized advice</li>
            <li> Roast Mode feedback</li>
            <li> Compare up to 5 outfits</li>
            <li> Style analytics & insights</li>
          </ul>
        </div>

        <div className="modal-actions">
          <button
            className="btn-continue"
            onClick={() => {
              onContinue()
              onClose()
            }}
          >
            Use My Last Free Rating
          </button>
          
          {/* SIMPLE BUTTON - Goes straight to Stripe */}
          <SimpleUpgradeButton 
            text="Upgrade for $4.99/month"
            className="btn-upgrade"
          />
        </div>

        <button className="btn-close-modal" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default LastRatingWarning