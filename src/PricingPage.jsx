import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function PricingPage() {
  const { userTier, user, userEmail } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [error, setError] = useState('');

  const handleUpgrade = async (plan) => {
    if (!user) {
      alert('Please log in to upgrade');
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: userEmail,
          plan: plan,
          billingCycle: billingCycle
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({ 
        sessionId 
      });
      
      if (stripeError) {
        console.error('Stripe redirect error:', stripeError);
        setError(stripeError.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      // Create portal session for managing subscription
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = {
    free: [
      '3 outfit ratings per day',
      'Basic helpful feedback',
      'Save up to 10 outfits',
      'View rating history',
      'Single outfit analysis'
    ],
    premium: [
      'Unlimited outfit ratings',
      'All feedback modes (Helpful, Honest, Roast)',
      'Unlimited saved outfits',
      'Outfit comparison (2-5 outfits)',
      'AI mix & match suggestions',
      'Priority support',
      'Advanced analytics',
      'Early access to new features',
      'No ads'
    ]
  };

  const pricing = {
    monthly: {
      amount: 4.99,
      label: 'per month',
      savings: null
    },
    yearly: {
      amount: 49.99,
      label: 'per year',
      savings: 'Save $10'
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <button onClick={() => navigate('/')} className="back-btn">← Back</button>
        <h1>Choose Your Plan</h1>
        <p className="subtitle">Upgrade to Premium for unlimited outfit ratings and advanced features</p>
      </div>

      {error && (
        <div className="error-message" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          {error}
        </div>
      )}

      {userTier === 'premium' && (
        <div className="current-plan-banner">
          <div>
            <strong>You're currently on the Premium plan.</strong> Thank you for your support!
          </div>
          <button 
            onClick={handleManageSubscription}
            className="manage-subscription-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </button>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="billing-toggle">
        <button 
          className={billingCycle === 'monthly' ? 'active' : ''}
          onClick={() => setBillingCycle('monthly')}
          disabled={loading}
        >
          Monthly
        </button>
        <button 
          className={billingCycle === 'yearly' ? 'active' : ''}
          onClick={() => setBillingCycle('yearly')}
          disabled={loading}
        >
          Yearly <span className="savings-badge">Save $10</span>
        </button>
      </div>

      <div className="pricing-cards">
        {/* Free Plan */}
        <div className={`pricing-card ${userTier === 'free' ? 'current' : ''}`}>
          <div className="plan-header">
            <h2>Free</h2>
            <div className="price">
              <span className="amount">$0</span>
              <span className="period">forever</span>
            </div>
          </div>

          <ul className="features-list">
            {features.free.map((feature, idx) => (
              <li key={idx}>
                <span className="checkmark">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          {userTier === 'free' ? (
            <button className="plan-btn current" disabled>
              Current Plan
            </button>
          ) : (
            <button className="plan-btn secondary" disabled>
              Downgrade
            </button>
          )}
        </div>

        {/* Premium Plan */}
        <div className={`pricing-card premium ${userTier === 'premium' ? 'current' : ''}`}>
          <div className="popular-badge">Most Popular</div>
          <div className="plan-header">
            <h2>Premium</h2>
            <div className="price">
              <span className="amount">${pricing[billingCycle].amount}</span>
              <span className="period">{pricing[billingCycle].label}</span>
            </div>
            {pricing[billingCycle].savings && (
              <div className="savings">{pricing[billingCycle].savings}</div>
            )}
          </div>

          <ul className="features-list">
            {features.premium.map((feature, idx) => (
              <li key={idx}>
                <span className="checkmark">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          {userTier === 'premium' ? (
            <button className="plan-btn current" disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className="plan-btn upgrade" 
              onClick={() => handleUpgrade('premium')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Upgrade to Premium'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Benefits Comparison */}
      <div className="benefits-section">
        <h2>Why Upgrade to Premium?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">∞</div>
            <h3>Unlimited Ratings</h3>
            <p>Rate as many outfits as you want, whenever you want. No daily limits.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💬</div>
            <h3>All Feedback Modes</h3>
            <p>Choose between Helpful, Honest, or Roast mode for personalized feedback.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🔄</div>
            <h3>Outfit Comparison</h3>
            <p>Compare up to 5 outfits side-by-side to find your best look.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">✨</div>
            <h3>AI Mix & Match</h3>
            <p>Get smart suggestions to combine items from different outfits.</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-item">
          <h3>Can I cancel anytime?</h3>
          <p>Yes! You can cancel your subscription at any time with no penalties. You'll continue to have access until the end of your billing period.</p>
        </div>

        <div className="faq-item">
          <h3>What payment methods do you accept?</h3>
          <p>We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets through our secure payment processor Stripe.</p>
        </div>

        <div className="faq-item">
          <h3>Is there a free trial?</h3>
          <p>The free plan gives you 3 ratings per day, which is a great way to try the service. If you love it, upgrade anytime for unlimited access!</p>
        </div>

        <div className="faq-item">
          <h3>What happens to my saved outfits if I downgrade?</h3>
          <p>Your saved outfits are safe! However, you won't be able to add new ones until you're back under the 10-outfit limit for free users.</p>
        </div>

        <div className="faq-item">
          <h3>Do you offer refunds?</h3>
          <p>Yes! If you're not satisfied within the first 7 days, contact us at support@outfitrater.com for a full refund.</p>
        </div>

        <div className="faq-item">
          <h3>How does the yearly plan work?</h3>
          <p>With the yearly plan, you pay $49.99 once per year (saving $10 compared to monthly). You get all Premium features for the entire year.</p>
        </div>

        <div className="faq-item">
          <h3>Is my payment information secure?</h3>
          <p>Absolutely! We use Stripe, a PCI-compliant payment processor trusted by millions of businesses worldwide. We never store your credit card information.</p>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="trust-section">
        <div className="trust-item">
          <span className="trust-icon">🔒</span>
          <div>
            <strong>Secure Payment</strong>
            <p>256-bit SSL encryption</p>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">⚡</span>
          <div>
            <strong>Instant Access</strong>
            <p>Start using Premium immediately</p>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">↻</span>
          <div>
            <strong>Cancel Anytime</strong>
            <p>No long-term commitment</p>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">💯</span>
          <div>
            <strong>7-Day Guarantee</strong>
            <p>Full refund if not satisfied</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {userTier === 'free' && (
        <div className="cta-section">
          <h2>Ready to upgrade your style game?</h2>
          <p>Join hundreds of fashion-forward users who trust AI Outfit Rater</p>
          <button 
            className="cta-button"
            onClick={() => handleUpgrade('premium')}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Start Premium Now'}
          </button>
          <p className="cta-note">
            Cancel anytime • 7-day money-back guarantee • No hidden fees
          </p>
        </div>
      )}
    </div>
  );
}

export default PricingPage;