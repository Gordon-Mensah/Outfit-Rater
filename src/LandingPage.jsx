// LandingPage.jsx - FIXED SYNTAX ERROR
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useEffect } from 'react'

function LandingPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user && !loading) {
      navigate('/rate', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="landing-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="landing-content">
        {/* Navigation */}
        <nav className="landing-nav">
          <div className="nav-brand">AI Outfit Rater</div>
          <div className="nav-actions">
            <button 
              className="nav-link"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button 
              className="nav-cta"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              AI-Powered Fashion Analysis
            </div>
            
            <h1 className="hero-heading">
              Elevate Your Style
              <span className="gradient-text">With AI Precision</span>
            </h1>
            
            <p className="hero-description">
              Upload your outfit and receive instant, detailed feedback from our 
              advanced AI fashion consultant. Get personalized recommendations 
              to perfect your look.
            </p>

            <div className="hero-cta">
              <button 
                className="btn-primary"
                onClick={() => navigate('/signup')}
              >
                Start Rating Free
                <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">5</div>
                <div className="stat-label">Free Ratings Daily</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">AI</div>
                <div className="stat-label">Powered Analysis</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Always Available</div>
              </div>
            </div>
          </div>

          {/* Visual Demo */}
          <div className="hero-visual">
            <div className="demo-card">
              <div className="demo-header">
                <div className="demo-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="demo-title">AI Analysis</span>
              </div>
              <div className="demo-content">
                <div className="demo-image-placeholder">
                  <img 
                    src="/download.png" 
                    alt="AI Outfit Rater" 
                    className="demo-logo"
                  />
                </div>
                <div className="demo-rating">
                  <div className="rating-circle-demo">
                    <span className="rating-num">8</span>
                    <span className="rating-total">/10</span>
                  </div>
                  <div className="rating-label-demo">Great Look</div>
                </div>
                <div className="demo-feedback">
                  <div className="feedback-line"></div>
                  <div className="feedback-line short"></div>
                  <div className="feedback-line"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-heading">How It Works</h2>
            <p className="section-subheading">
              Three simple steps to transform your style
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15l-5-5L5 21" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="feature-number">01</div>
              <h3 className="feature-title">Upload Your Outfit</h3>
              <p className="feature-description">
                Take a photo or upload an existing image of your outfit 
                for instant AI analysis
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="feature-number">02</div>
              <h3 className="feature-title">AI Analysis</h3>
              <p className="feature-description">
                Our advanced AI evaluates your outfit based on fit, color 
                harmony, and occasion appropriateness
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="feature-number">03</div>
              <h3 className="feature-title">Get Detailed Feedback</h3>
              <p className="feature-description">
                Receive actionable suggestions to enhance your style 
                with specific improvement recommendations
              </p>
            </div>
          </div>
        </section>

        {/* Feedback Modes */}
        <section className="modes-section">
          <div className="section-header">
            <h2 className="section-heading">Choose Your Feedback Style</h2>
            <p className="section-subheading">
              Personalized feedback that matches your needs
            </p>
          </div>

          <div className="modes-grid">
            <div className="mode-card">
              <div className="mode-header">
                <h3 className="mode-name">Helpful</h3>
                <span className="mode-badge free">Free</span>
              </div>
              <p className="mode-description">
                Encouraging and constructive feedback focused on building 
                confidence while improving your style
              </p>
              <div className="mode-features">
                <div className="mode-feature">Positive reinforcement</div>
                <div className="mode-feature">Gentle suggestions</div>
                <div className="mode-feature">Confidence building</div>
              </div>
            </div>

            <div className="mode-card">
              <div className="mode-header">
                <h3 className="mode-name">Honest</h3>
                <span className="mode-badge free">Free</span>
              </div>
              <p className="mode-description">
                Balanced and realistic assessment with straightforward 
                suggestions for improvement
              </p>
              <div className="mode-features">
                <div className="mode-feature">Direct feedback</div>
                <div className="mode-feature">Realistic assessment</div>
                <div className="mode-feature">Practical advice</div>
              </div>
            </div>

            <div className="mode-card premium-card">
              <div className="mode-header">
                <h3 className="mode-name">Roast</h3>
                <span className="mode-badge premium">Premium</span>
              </div>
              <p className="mode-description">
                Brutally honest feedback with humor for those who want 
                the unfiltered truth about their outfit
              </p>
              <div className="mode-features">
                <div className="mode-feature">Unfiltered honesty</div>
                <div className="mode-feature">Humorous delivery</div>
                <div className="mode-feature">Entertainment value</div>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Section */}
        <section className="premium-section">
          <div className="premium-card">
            <div className="premium-header">
              <span className="premium-tag">Premium</span>
              <h2 className="premium-heading">Unlock Full Potential</h2>
              <p className="premium-subheading">
                Get unlimited access to all features and AI-powered tools
              </p>
            </div>

            <div className="premium-features">
              <div className="premium-feature">
                <svg className="feature-check" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Unlimited daily ratings</span>
              </div>
              <div className="premium-feature">
                <svg className="feature-check" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>AI Style Chat assistant</span>
              </div>
              <div className="premium-feature">
                <svg className="feature-check" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Roast Mode feedback</span>
              </div>
              <div className="premium-feature">
                <svg className="feature-check" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Compare up to 5 outfits</span>
              </div>
              <div className="premium-feature">
                <svg className="feature-check" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Advanced style analytics</span>
              </div>
              <div className="premium-feature">
                <svg className="feature-check" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Priority support</span>
              </div>
            </div>

            <div className="premium-pricing">
              <div className="price-amount">$5.99</div>
              <div className="price-period">per month</div>
            </div>

            <button 
              className="btn-premium"
              onClick={() => navigate('/signup')}
            >
              Start Free Trial
            </button>

            <p className="premium-note">
              No credit card required for free trial
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-heading">Ready to Transform Your Style?</h2>
            <p className="cta-subheading">
              Join thousands using AI to elevate their fashion game
            </p>
            <button 
              className="btn-cta"
              onClick={() => navigate('/signup')}
            >
              Get Started Now
              <svg className="btn-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">AI Outfit Rater</div>
              <p className="footer-tagline">Your AI-powered style consultant</p>
            </div>
            <div className="footer-links">
              <button onClick={() => navigate('/signup')}>Sign Up</button>
              <button onClick={() => navigate('/login')}>Sign In</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 AI Outfit Rater. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage