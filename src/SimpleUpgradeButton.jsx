// SimpleUpgradeButton.jsx - Direct to Stripe Checkout
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from './AuthContext' // Your auth context
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://outfitrater.xyz' 
  : 'http://localhost:3000'

// Initialize Stripe (do this once outside component)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function SimpleUpgradeButton({ 
  plan = 'premium',
  billingCycle = 'monthly', // 'monthly' or 'yearly'
  text,
  className = '',
  showPrice = false
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const prices = {
    monthly: '$4.99/mo',
    yearly: '$99.99/yr'
  }

  const defaultText = text || `Upgrade to ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Plan`

  const handleUpgrade = async () => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      // Create Stripe checkout session
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          plan: plan,
          billingCycle: billingCycle
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      if (data.sessionId) {
        // Get Stripe instance and redirect to checkout
        const stripe = await stripePromise
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        })

        if (error) {
          console.error('Stripe redirect error:', error)
          alert('Failed to redirect to checkout. Please try again.')
          setLoading(false)
        }
      } else {
        throw new Error('No session ID received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3 
        bg-blue-600 text-white 
        rounded-lg font-semibold 
        hover:bg-blue-700 
        disabled:bg-gray-400 disabled:cursor-not-allowed 
        transition-all
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </>
      ) : (
        <>
          {defaultText}
          {showPrice && (
            <span className="text-sm opacity-90">
              {prices[billingCycle]}
            </span>
          )}
        </>
      )}
    </button>
  )
}

export default SimpleUpgradeButton