// SimpleUpgradeButton.jsx - Direct to Stripe Checkout
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function SimpleUpgradeButton({ text = "Upgrade to Premium", className = "btn-upgrade-simple" }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    // If not logged in, go to login first
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      // Call backend to create Stripe checkout session
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email
        })
      })

      const data = await response.json()

      if (data.url) {
        // Redirect directly to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      className={className}
      onClick={handleUpgrade}
      disabled={loading}
    >
      {loading ? 'Loading...' : text}
    </button>
  )
}

export default SimpleUpgradeButton