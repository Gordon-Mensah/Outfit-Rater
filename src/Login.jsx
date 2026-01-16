// 👗 FASHION-FOCUSED LUXURY LOGIN PAGE
// Elegant animations, runway-inspired design, and premium aesthetics

import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) throw error
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email first')
        } else {
          setError(error.message)
        }
        return
      }
      navigate('/')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fashion-login-container">
      {/* Animated Background */}
      <div className="fashion-background">
        <div className="fashion-gradient-orb orb-1"></div>
        <div className="fashion-gradient-orb orb-2"></div>
        <div className="fashion-gradient-orb orb-3"></div>
        <div className="fashion-pattern"></div>
      </div>

      {/* Main Content */}
      <div className="fashion-content">
        {/* Left Side - Branding Showcase */}
        <div className="fashion-showcase">
          <div className="showcase-content">
            {/* Logo Area */}
            <div className="brand-header">
              <div className="brand-icon">
                <svg viewBox="0 0 100 100" className="logo-svg">
                  <path d="M50 10 L30 40 L50 35 L70 40 Z" className="hanger-top" />
                  <rect x="48" y="38" width="4" height="50" className="hanger-rod" />
                  <path d="M20 88 L50 75 L80 88" className="dress-bottom" />
                </svg>
              </div>
              <h1 className="brand-title">AI Outfit Rater</h1>
              <p className="brand-tagline">Your Personal Style AI</p>
            </div>

            {/* Feature Cards */}
            <div className="feature-cards">
              <div className="feature-card card-delay-1">
                <h3>AI-Powered</h3>
                <p>Advanced vision AI analyzes your style</p>
              </div>
              <div className="feature-card card-delay-2">
                <h3>Fashion Expert</h3>
                <p>Get feedback from AI fashion consultant</p>
              </div>
              <div className="feature-card card-delay-3">
                <h3>Track Progress</h3>
                <p>See your style evolve over time</p>
              </div>
            </div>

            {/* Rotating Fashion Icons */}
            <div className="fashion-icons-orbit">
              <div className="orbit-item orbit-1">👔</div>
              <div className="orbit-item orbit-2">👗</div>
              <div className="orbit-item orbit-3">👠</div>
              <div className="orbit-item orbit-4">👜</div>
              <div className="orbit-item orbit-5">🕶️</div>
              <div className="orbit-item orbit-6">💄</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="fashion-form-wrapper">
          <div className="fashion-form-card">
            {/* Form Header */}
            <div className="form-header-fashion">
              <h2 className="form-title-fashion">Welcome Back</h2>
              <p className="form-subtitle-fashion">Continue your style journey</p>
            </div>

            {/* Google Sign-In */}
            <button 
              onClick={handleGoogleSignIn}
              className="fashion-google-btn"
              disabled={loading}
              type="button"
            >
              <svg className="google-icon-fashion" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
              <div className="btn-shimmer"></div>
            </button>

            {/* Divider */}
            <div className="fashion-divider">
              <span className="divider-line"></span>
              <span className="divider-text">or use email</span>
              <span className="divider-line"></span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="fashion-form">
              {/* Email */}
              <div className="fashion-input-group">
                <label className="fashion-label">Email Address</label>
                <div className="input-wrapper-fashion">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="fashion-input"
                  />
                  <div className="input-border-glow"></div>
                </div>
              </div>

              {/* Password */}
              <div className="fashion-input-group">
                <label className="fashion-label">Password</label>
                <div className="input-wrapper-fashion">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="fashion-input"
                  />
                  <button
                    type="button"
                    className="toggle-password-fashion"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <div className="input-border-glow"></div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="fashion-error">
                  <span className="error-icon-fashion">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className="fashion-submit-btn"
                disabled={loading}
              >
                <span className="btn-content">
                  {loading ? (
                    <>
                      <span className="btn-spinner-fashion"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span className="btn-arrow-fashion">→</span>
                    </>
                  )}
                </span>
                <div className="btn-glow"></div>
              </button>
            </form>

            {/* Footer */}
            <div className="fashion-form-footer">
              <p className="footer-text">
                Don't have an account?{' '}
                <button 
                  onClick={() => navigate('/signup')}
                  className="fashion-link-btn"
                  disabled={loading}
                >
                  Create one now
                </button>
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="form-decoration-1"></div>
            <div className="form-decoration-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login