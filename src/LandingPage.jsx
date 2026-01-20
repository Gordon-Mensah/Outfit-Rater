// LandingPage.jsx - Minimal, Clean Design Matching App Aesthetic
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useEffect } from 'react'

function LandingPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // Auto-redirect logged-in users
  useEffect(() => {
    if (user && !loading) {
      navigate('/rate', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return <div className="loading-container">Loading...</div>
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="landing-page-minimal">
      <div className="landing-container">
        {/* Header */}
        <header className="landing-header">
          <h1 className="app-title">AI Outfit Rater</h1>
        </header>

        {/* Hero Section */}
        <section className="hero-minimal">
          <div className="hero-content-minimal">
            <h2 className="hero-title-minimal">
              Rate Your Fit,<br />Level Up Your Style
            </h2>
            <p className="hero-subtitle-minimal">
              Upload your outfit photo and get instant AI-powered fashion feedback
            </p>

            {/* Feature Pills */}
            <div className="feature-pills">
              <span className="pill"> Upload Photo</span>
              <span className="pill"> Get Rating</span>
              <span className="pill"> Improve Style</span>
            </div>

            {/* CTA Buttons */}
            <div className="cta-buttons-minimal">
              <button 
                className="btn-primary-landing"
                onClick={() => navigate('/signup')}
              >
                Get Started Free
              </button>
              <button 
                className="btn-secondary-landing"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>

            <p className="cta-note-minimal">
            5 free ratings per day • No credit card required
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works-minimal">
          <h3 className="section-title-minimal">How It Works</h3>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4>Upload Your Outfit</h4>
              <p>Take or upload a photo of your outfit</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h4>Choose Occasion</h4>
              <p>Select where you're wearing it</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h4>Get AI Feedback</h4>
              <p>Receive instant rating & styling tips</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h4>Level Up</h4>
              <p>Apply suggestions & improve</p>
            </div>
          </div>
        </section>

        {/* Feedback Modes */}
        <section className="modes-minimal">
          <h3 className="section-title-minimal">Choose Your Feedback Style</h3>
          
          <div className="modes-grid-minimal">
            <div className="mode-card-minimal">
              <h4>Helpful</h4>
              <p>Encouraging & constructive</p>
              <span className="mode-tag free">Free</span>
            </div>

            <div className="mode-card-minimal">
              <h4>Honest</h4>
              <p>Balanced & realistic</p>
              <span className="mode-tag free">Free</span>
            </div>

            <div className="mode-card-minimal">
              <h4>Roast</h4>
              <p>Brutally honest with humor</p>
              <span className="mode-tag premium">Premium</span>
            </div>
          </div>
        </section>

        {/* Premium CTA */}
        <section className="premium-cta-minimal">
          <div className="premium-box">
            <span className="premium-badge-mini">Premium</span>
            <h3>Unlock All Features</h3>
            <p>Unlimited ratings • AI Chat • Roast Mode • Compare Outfits</p>
            <div className="price-tag-minimal">
              <span className="price">$4.99</span><span className="period">/month</span>
            </div>
            <button 
              className="btn-premium-landing"
              onClick={() => navigate('/signup')}
            >
              Start Free Trial
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer-minimal">
          <p>© 2025 AI Outfit Rater • <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Sign Up</a> • <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Login</a></p>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage