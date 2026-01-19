// 👗 FASHION-FOCUSED LUXURY SIGNUP PAGE
// Matching the elegant Login page design

import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import PromoCodeInput from './PromoCodeInput'

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
  const [appliedCode, setAppliedCode] = useState(null)

  const handleGoogleSignUp = async () => {
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

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await signUp(email, password)

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
      setTimeout(() => navigate('/login'), 2000)


              // Process referral or promo if stored (email/password signup)
        try {
          const pendingRef = localStorage.getItem("pendingReferral")
          const pendingPromo = localStorage.getItem("pendingPromo")

          if (pendingPromo) {
            const applied = JSON.parse(pendingPromo)
            await supabase.from("referral_transactions").insert({
              referee_id: (await supabase.auth.getUser()).data.user.id,
              promo_code: applied.type === "influencer" ? applied.code : null,
              referral_code: applied.type === "user" ? applied.code : null,
              referrer_id: applied.referrerId,
              transaction_type: applied.type,
              referee_discount: applied.discount === "free" ? 4.99 : 0.998,
              status: "pending"
            })
          }

          if (pendingRef) {
            const { data: link } = await supabase
              .from("referral_links")
              .select("user_id")
              .eq("referral_code", pendingRef)
              .single()

            if (link) {
              await supabase.from("referral_transactions").insert({
                referee_id: (await supabase.auth.getUser()).data.user.id,
                referral_code: pendingRef,
                referrer_id: link.user_id,
                transaction_type: "user",
                referee_discount: 0.998,
                status: "pending"
              })
            }
          }

          localStorage.removeItem("pendingReferral")
          localStorage.removeItem("pendingPromo")
        } catch (err) {
          console.error("Referral processing error:", err)
        }

      
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (password.length === 0) return null
    if (password.length < 6) return 'weak'
    if (password.length < 10) return 'medium'
    return 'strong'
  }

  const passwordStrength = getPasswordStrength()

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
                <h3>3 Free Daily Ratings</h3>
                <p>Get started with generous free tier</p>
              </div>
              <div className="feature-card card-delay-2">
                <h3>Expert Feedback</h3>
                <p>Detailed AI-powered fashion insights</p>
              </div>
              <div className="feature-card card-delay-3">
                <h3>Track Your Style</h3>
                <p>Save history and watch yourself improve</p>
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

        {/* Right Side - Signup Form */}
        <div className="fashion-form-wrapper">
          <div className="fashion-form-card">
            {/* Form Header */}
            <div className="form-header-fashion">
              <h2 className="form-title-fashion">Create Account</h2>
              <p className="form-subtitle-fashion">Start your style journey today</p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="fashion-success">
                <span className="success-icon-fashion">✅</span>
                <div>
                  <strong>Account created!</strong>
                  <p>Check your email to confirm</p>
                </div>
              </div>
            )}

            {/* Google Sign-Up */}
            <button 
              onClick={handleGoogleSignUp}
              className="fashion-google-btn"
              disabled={loading || success}
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

            {/* Signup Form */}
            <form onSubmit={handleSignUp} className="fashion-form">
              {/* Email */}
              <div className="fashion-input-group">
                <label className="fashion-label">Email Address</label>
                <div className="input-wrapper-fashion">
                  <span className="input-icon-fashion">✉️</span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || success}
                    className="fashion-input"
                  />
                  <div className="input-border-glow"></div>
                </div>
              </div>

              {/* Password */}
              <div className="fashion-input-group">
                <label className="fashion-label">Password</label>
                <div className="input-wrapper-fashion">
                  <span className="input-icon-fashion">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || success}
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

              {/* Confirm Password */}
              <div className="fashion-input-group">
                <label className="fashion-label">Confirm Password</label>
                <div className="input-wrapper-fashion">
                  <span className="input-icon-fashion">🔒</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || success}
                    minLength={6}
                    className="fashion-input"
                  />
                  <button
                    type="button"
                    className="toggle-password-fashion"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <div className="input-border-glow"></div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="fashion-password-strength">
                  <div className="strength-bar-fashion">
                    <div className={`strength-fill-fashion ${passwordStrength}`}></div>
                  </div>
                  <span className={`strength-text-fashion ${passwordStrength}`}>
                    {passwordStrength === 'weak' && '⚠️ Weak'}
                    {passwordStrength === 'medium' && '✓ Good'}
                    {passwordStrength === 'strong' && '✓✓ Strong'}
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="fashion-error">
                  <span className="error-icon-fashion">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <PromoCodeInput onCodeApplied={setAppliedCode} />

              {/* Submit Button */}
              <button 
                type="submit" 
                className="fashion-submit-btn"
                disabled={loading || success}
              >
                <span className="btn-content">
                  {loading ? (
                    <>
                      <span className="btn-spinner-fashion"></span>
                      Creating account...
                    </>
                  ) : success ? (
                    <>
                      ✅ Account created!
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="btn-arrow-fashion">→</span>
                    </>
                  )}
                </span>
                <div className="btn-glow"></div>
              </button>

              {/* Terms */}
              <p className="fashion-terms">
                By signing up, you agree to our Terms & Privacy Policy
              </p>
            </form>

            {/* Footer */}
            <div className="fashion-form-footer">
              <p className="footer-text">
                Already have an account?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="fashion-link-btn"
                  disabled={loading || success}
                >
                  Sign in
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

export default SignUp