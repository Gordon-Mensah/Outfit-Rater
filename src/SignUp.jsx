// SignUp.jsx - COMPLETE UPDATED VERSION
// Fixed: No auto-redirect, better UX

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
        options: { redirectTo: `${window.location.origin}/rate` }
      })

      if (error) throw error

      // Wait for Supabase to finish login
      setTimeout(async () => {
        const { data: userData } = await supabase.auth.getUser()

        if (userData?.user?.email) {
          // Send welcome email
          fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.user.email }),
          })
        }
      }, 1500)

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
      
      // ✅ REMOVED AUTO-REDIRECT - Users click "Sign in" when ready
      // setTimeout(() => navigate('/login'), 2000) ← DELETED

      // Send welcome email
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // Process referral or promo
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
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Content */}
      <div className="auth-content">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-circle">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15l-5-5L5 21" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="logo-text">AI Outfit Rater</span>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Start rating your outfits with AI</p>
          </div>

          {/* Success Message - UPDATED */}
          {success && (
            <div className="success-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <strong>Account created successfully!</strong>
                <p>Check your email to confirm your account, then click "Sign in" below to continue.</p>
              </div>
            </div>
          )}

          {/* Google Button */}
          <button 
            onClick={handleGoogleSignUp}
            className="auth-google-btn"
            disabled={loading || success}
            type="button"
          >
            <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span className="divider-line"></span>
            <span className="divider-text">or</span>
            <span className="divider-line"></span>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
                className="form-input"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  minLength={6}
                  className="form-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  minLength={6}
                  className="form-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength */}
            {passwordStrength && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div className={`strength-fill ${passwordStrength}`}></div>
                </div>
                <span className={`strength-text ${passwordStrength}`}>
                  {passwordStrength === 'weak' && 'Weak password'}
                  {passwordStrength === 'medium' && 'Good password'}
                  {passwordStrength === 'strong' && 'Strong password'}
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Promo Code */}
            <PromoCodeInput onCodeApplied={setAppliedCode} />

            {/* Submit */}
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Creating account...
                </>
              ) : success ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Account created!
                </>
              ) : (
                <>
                  Create Account
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path d="M4 10h12m0 0l-4-4m4 4l-4 4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </>
              )}
            </button>

            {/* Terms */}
            <p className="terms-text">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          {/* Footer - UPDATED */}
          <div className="auth-footer">
            <p className="footer-text">
              {success ? (
                /* After successful signup */
                <>
                  Email confirmed?{' '}
                  <button 
                    onClick={() => navigate('/login')}
                    className="link-btn"
                    style={{ 
                      fontWeight: '700',
                      textDecoration: 'underline'
                    }}
                  >
                    Sign in now →
                  </button>
                </>
              ) : (
                /* Before signup */
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => navigate('/login')}
                    className="link-btn"
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Back to home */}
        <button 
          onClick={() => navigate('/')}
          className="back-home-btn"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M16 10l-4-4m0 0l-4 4m4-4v12M4 10h12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Back to home
        </button>
      </div>
    </div>
  )
}

export default SignUp