// 📚 BEAUTIFUL MODERN SIGNUP PAGE
// Enhanced design with animations, better layout, and professional styling

import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 🔵 Handle Google Sign Up
  const handleGoogleSignUp = async () => {
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

  // ✅ Validate form
  const validateForm = () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  // 📧 Handle Email/Password Signup
  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await signUp(email, password)

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Email already registered. Try logging in.')
        } else if (error.message.includes('password')) {
          setError('Password is too weak. Add numbers or symbols.')
        } else {
          setError(error.message)
        }
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      
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
          <h2>Join thousands of fashion enthusiasts</h2>
          <p>Start your style journey with AI-powered fashion insights</p>
          
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🆓</span>
              <span>3 Free Ratings Daily</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Detailed Feedback</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span>Save Your History</span>
            </div>
          </div>

          <div className="testimonial">
            <p>"This app completely transformed how I choose outfits!"</p>
            <span>- Sarah, Fashion Enthusiast</span>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <div className="form-header">
            <h2>Create your account</h2>
            <p>Start rating your outfits for free</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="modern-success">
              <span className="success-icon">✅</span>
              <div>
                <strong>Account created!</strong>
                <p>Check your email to confirm your account</p>
              </div>
            </div>
          )}

          {/* Google Sign-Up Button */}
          <button 
            onClick={handleGoogleSignUp}
            className="modern-google-button"
            disabled={loading || success}
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
            <span>or sign up with email</span>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignUp} className="modern-form">
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
                  disabled={loading || success}
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
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
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

            {/* Confirm Password Input */}
            <div className="modern-input-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  minLength={6}
                  className="modern-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill ${
                      password.length < 6 ? 'weak' : 
                      password.length < 10 ? 'medium' : 
                      'strong'
                    }`}
                    style={{
                      width: `${Math.min((password.length / 12) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <span className="strength-text">
                  {password.length < 6 ? 'Weak' : 
                   password.length < 10 ? 'Good' : 
                   'Strong'}
                </span>
              </div>
            )}

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
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Creating account...
                </>
              ) : success ? (
                <>
                  ✅ Account created!
                </>
              ) : (
                <>
                  Create account
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>

            {/* Terms */}
            <p className="terms-text">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          {/* Login Link */}
          <div className="form-footer">
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="modern-link-button"
                disabled={loading || success}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp