import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

function PricingPage() {
  const { userTier, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleUpgrade = async (plan) => {
    setLoading(true);

    // TODO: Integrate Stripe Checkout
    // For now, just simulate the flow
    try {
      // This will be replaced with actual Stripe integration
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan: plan,
          billingCycle: billingCycle
        })
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      // const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
      // stripe.redirectToCheckout({ sessionId });

      alert('Payment integration coming soon! Check back later.');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
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

      {userTier === 'premium' && (
        <div className="current-plan-banner">
          You're currently on the Premium plan. Thank you for your support!
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="billing-toggle">
        <button 
          className={billingCycle === 'monthly' ? 'active' : ''}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button 
          className={billingCycle === 'yearly' ? 'active' : ''}
          onClick={() => setBillingCycle('yearly')}
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
            <button className="plan-btn" disabled>
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
              {loading ? 'Processing...' : 'Upgrade to Premium'}
            </button>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-item">
          <h3>Can I cancel anytime?</h3>
          <p>Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
        </div>

        <div className="faq-item">
          <h3>What payment methods do you accept?</h3>
          <p>We accept all major credit cards, debit cards, and digital wallets through Stripe.</p>
        </div>

        <div className="faq-item">
          <h3>Is there a free trial?</h3>
          <p>The free plan gives you 3 ratings per day, which is a great way to try the service. If you love it, upgrade anytime!</p>
        </div>

        <div className="faq-item">
          <h3>What happens to my saved outfits if I downgrade?</h3>
          <p>Your saved outfits are safe! However, you won't be able to add new ones until you're back under the 10-outfit limit for free users.</p>
        </div>

        <div className="faq-item">
          <h3>Do you offer refunds?</h3>
          <p>Yes! If you're not satisfied within the first 7 days, contact support for a full refund.</p>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="trust-section">
        <div className="trust-item">
          <span className="trust-icon">🔒</span>
          <p>Secure Payment</p>
        </div>
        <div className="trust-item">
          <span className="trust-icon">⚡</span>
          <p>Instant Access</p>
        </div>
        <div className="trust-item">
          <span className="trust-icon">↻</span>
          <p>Cancel Anytime</p>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;