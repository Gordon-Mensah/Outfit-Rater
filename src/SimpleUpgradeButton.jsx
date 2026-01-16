import { useState } from 'react'

// Mock auth hook - replace with your actual auth
const useAuth = () => ({ user: { id: 'user_123', email: 'user@example.com' } })

const API_BASE_URL = 'https://outfitrater.xyz'

function SimpleUpgradeButton({ text = "Upgrade to Premium", className = "btn-upgrade-simple" }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!user) {
      alert('Please log in first')
      return
    }

    setLoading(true)

    try {
      // Create Stripe checkout session
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
        // Redirect to Stripe Checkout
        // After payment, Stripe will:
        // 1. Send webhook to /api/stripe-webhook
        // 2. Redirect user to success_url
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
    <div className="p-8 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Premium Plan</h2>
        <p className="text-gray-600 mb-6">
          Unlock all features with our premium subscription
        </p>
        <div className="text-3xl font-bold mb-6">
          $9.99<span className="text-lg text-gray-500">/month</span>
        </div>
        <button
          className={`w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition ${className}`}
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? 'Loading...' : text}
        </button>
        <p className="text-xs text-gray-500 mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  )
}

export default SimpleUpgradeButton