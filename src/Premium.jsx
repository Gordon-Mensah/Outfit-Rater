// Premium.jsx - Premium Subscription Page with Stripe Integration
import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import SimpleUpgradeButton from './SimpleUpgradeButton'

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function Premium() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' or 'yearly'

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      // Call your backend to create Stripe checkout session
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          priceId: billingPeriod === 'monthly' 
            ? process.env.STRIPE_MONTHLY_PRICE_ID 
            : process.env.STRIPE_YEARLY_PRICE_ID
        })
      })

      const { url } = await response.json()

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      title: 'AI Style Chat',
      description: 'Unlimited conversations with your personal AI fashion consultant',
      premium: true
    },
    {
      title: 'Unlimited Ratings',
      description: 'Rate unlimited outfits per day (free users get 50/day)',
      premium: true
    },
    {
      title: 'Advanced Comparisons',
      description: 'Compare up to 5 outfits side-by-side with detailed analysis',
      premium: true
    },
    {
      title: 'Roast Mode',
      description: 'Get brutally honest feedback for when you need the hard truth',
      premium: true
    },
    {
      title: 'Priority Support',
      description: 'Get help faster with priority customer support',
      premium: true
    },
    {
      title: 'Style Analytics',
      description: 'Track your fashion journey with detailed stats and insights',
      premium: true
    },
    {
      title: 'Custom Feedback Styles',
      description: 'Choose between Helpful, Honest, or Roast mode feedback',
      premium: true
    },
    {
      title: 'Early Access',
      description: 'Be first to try new AI features and improvements',
      premium: true
    }
  ]

  return (
    <div className="premium-page">
      {/* Hero Section */}
      <div className="premium-hero">
        <div className="premium-hero-content">
          <div className="premium-badge-large">
            <span>Premium</span>
          </div>
          
          <h1 className="premium-title">
            Unlimited AI Outfit Ratings
          </h1>
          
          <p className="premium-subtitle">
            Get unlimited AI-powered fashion advice, advanced features, and personalized styling help
          </p>

          {isPremium && (
            <div className="premium-status-banner">
              <div className="status-icon">✓</div>
              <div className="status-text">
                <h3>You're Premium!</h3>
                <p>Enjoying all premium features</p>
              </div>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="hero-decoration decoration-1"></div>
        <div className="hero-decoration decoration-2"></div>
        <div className="hero-decoration decoration-3"></div>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-section">
        <div className="pricing-container">
          {/* Billing Toggle */}
          <div className="billing-toggle">
            <button
              className={billingPeriod === 'monthly' ? 'active' : ''}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={billingPeriod === 'yearly' ? 'active' : ''}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
              <span className="save-badge">Save 40%</span>
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="pricing-cards">
            {/* Free Plan */}
            <div className="pricing-card free-plan">
              <div className="plan-header">
                <h3>Free</h3>
                <div className="plan-price">
                  <span className="price-amount">$0</span>
                  <span className="price-period">/month</span>
                </div>
              </div>

              <ul className="plan-features">
                <li className="feature-item">
                  <span className="feature-icon check">✓</span>
                  <span>50 outfit ratings per day</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check">✓</span>
                  <span>Compare up to 3 outfits</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check">✓</span>
                  <span>Basic AI feedback</span>
                </li>
                <li className="feature-item disabled">
                  <span className="feature-icon cross">✗</span>
                  <span>AI Style Chat</span>
                </li>
                <li className="feature-item disabled">
                  <span className="feature-icon cross">✗</span>
                  <span>Roast Mode</span>
                </li>
                <li className="feature-item disabled">
                  <span className="feature-icon cross">✗</span>
                  <span>Style Analytics</span>
                </li>
              </ul>

              <button className="plan-button free-button" disabled>
                Current Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="pricing-card premium-plan featured">
              <div className="featured-badge">Most Popular</div>
              
              <div className="plan-header">
                <h3>Premium</h3>
                <div className="plan-price">
                  <span className="price-amount">
                    ${billingPeriod === 'monthly' ? 5.99 : (5.99 * 11).toFixed(2)}
                  </span>
                  <span className="price-period">/month</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="billing-note">Billed as $65.89/year</p>
                )}
              </div>

              <ul className="plan-features">
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span><strong>Everything in Free, plus:</strong></span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span>Unlimited AI Style Chat</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span>Unlimited daily ratings</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span>Compare up to 5 outfits</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span>Roast Mode & all feedback styles</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span>Style Analytics & Insights</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span>Priority Support</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon check gold">✓</span>
                  <span>Early access to new features</span>
                </li>
              </ul>

              {isPremium ? (
                <button 
                  className="plan-button premium-button active"
                  onClick={handleManageBilling}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Manage Billing'}
                </button>
              ) : (
                <button 
                  className="plan-button premium-button"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="button-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade to Premium
                      <span className="button-arrow">→</span>
                    </>
                  )}
                </button>
              )}

              <p className="plan-guarantee">
                ✓ Cancel anytime • No long-term commitment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-showcase">
        <div className="features-container">
          <h2 className="features-title">Everything You Get with Premium</h2>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-large">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <div className="faq-container">
          <h2>Frequently Asked Questions</h2>
          
          <div className="faq-list">
            <div className="faq-item">
              <h4>Can I cancel anytime?</h4>
              <p>Yes! You can cancel your subscription at any time from the billing portal. You'll continue to have access until the end of your billing period.</p>
            </div>
            
            <div className="faq-item">
              <h4>What payment methods do you accept?</h4>
              <p>We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.</p>
            </div>
            
            <div className="faq-item">
              <h4>Is there a free trial?</h4>
              <p>You can use our free tier indefinitely with 50 ratings per day. Upgrade to Premium anytime to unlock all features.</p>
            </div>
            
            <div className="faq-item">
              <h4>How does the AI Style Chat work?</h4>
              <p>Our AI chatbot provides personalized fashion advice based on your outfit. Ask about color alternatives, accessories, shoes, budget options, and more!</p>
            </div>

            <div className="faq-item">
              <h4>What happens to my data if I cancel?</h4>
              <p>Your outfit history and ratings are saved. You'll keep access to your data but won't be able to use premium features like AI chat.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isPremium && (
        <div className="cta-section">
          <div className="cta-content">
            <h2>Ready to Upgrade Your Style?</h2>
            <p>Join thousands of fashion-forward users getting AI-powered advice</p>
            <SimpleUpgradeButton 
                text="Upgrade to Premium - $5.99/month"
                className="btn-upgrade-simple"
            />
            <p className="cta-subtext">$5.99/month • Cancel anytime</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Premium