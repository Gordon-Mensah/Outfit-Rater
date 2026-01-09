// 📚 BEAUTIFUL MODERN LOGIN PAGE
// Enhanced design with animations, better layout, and professional styling

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

  // 🔵 Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      })

      if (error) throw error
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // 📧 Handle Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)

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
    <div className="modern-auth-container">
      {/* Left side - Branding */}
      <div className="auth-branding">
        <div className="branding-content">
          <div className="brand-logo">
            <div className="logo-icon">👕</div>
            <h1>Outfit Rater</h1>
          </div>
          <h2>Rate your style with AI</h2>
          <p>Get instant fashion feedback powered by artificial intelligence</p>
          
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Personalized Feedback</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Track Your Style</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your account</p>
          </div>

          {/* Google Sign-In Button */}
          <button 
            onClick={handleGoogleSignIn}
            className="modern-google-button"
            disabled={loading}
            type="button"
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="modern-divider">
            <span>or continue with email</span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="modern-form">
            {/* Email Input */}
            <div className="modern-input-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="modern-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="modern-input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="modern-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="modern-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="modern-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="form-footer">
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/signup')}
                className="modern-link-button"
                disabled={loading}
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
