// 📚 WHAT IS THIS FILE?
// This is the Sign Up page where NEW users create their account.
// We collect email and password, send it to Supabase, and create their account.

import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

function SignUp() {
  // 🎣 HOOKS
  const { signUp } = useAuth()
  const navigate = useNavigate()
  
  // 📝 FORM STATE
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // ⏳ OTHER STATE
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // ✅ FUNCTION: Validate form before submitting
  const validateForm = () => {
    // Check if email looks valid
    if (!email.includes('@')) {
      setError('❌ Please enter a valid email address')
      return false
    }

    // Check password length
    if (password.length < 6) {
      setError('❌ Password must be at least 6 characters long')
      return false
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('❌ Passwords don\'t match')
      return false
    }

    return true
  }

  // 🎬 FUNCTION: Handle form submission
  const handleSignUp = async (e) => {
    e.preventDefault()
    
    // Clear previous messages
    setError('')
    setSuccess(false)

    // Validate the form
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Call our signUp function from AuthContext
      const { data, error } = await signUp(email, password)

      if (error) {
        // Show user-friendly error messages
        if (error.message.includes('already registered')) {
          setError('❌ This email is already registered. Try logging in instead.')
        } else if (error.message.includes('password')) {
          setError('❌ Password is too weak. Try adding numbers or symbols.')
        } else {
          setError(`❌ ${error.message}`)
        }
        return
      }

      // Success!
      setSuccess(true)
      
      // Wait 2 seconds, then redirect to login
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      
    } catch (err) {
      setError('❌ Something went wrong. Please try again.')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* 👕 Logo/Title */}
        <div className="auth-header">
          <h1>👕 Outfit Rater</h1>
          <p>Create your account and start rating outfits!</p>
        </div>

        {/* ✅ Success Message */}
        {success && (
          <div className="success-message">
            ✅ Account created! Redirecting to login...
          </div>
        )}

        {/* 📋 Sign Up Form */}
        <form onSubmit={handleSignUp} className="auth-form">
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
            />
            <small className="form-hint">
              We'll never share your email with anyone
            </small>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || success}
              minLength={6}
            />
            <small className="form-hint">
              Make it strong! Use letters, numbers, and symbols
            </small>
          </div>

          {/* Confirm Password Input */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Type your password again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || success}
              minLength={6}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Creating account...
              </>
            ) : success ? (
              '✅ Success!'
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* 🔗 Link to Login */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="link-button"
              disabled={loading || success}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp

// 📖 HOW THIS WORKS:
// 
// 1. User fills out form (email, password, confirm password)
// 2. User clicks "Sign Up"
// 3. validateForm checks:
//    - Is email valid?
//    - Is password long enough?
//    - Do passwords match?
// 4. If valid, handleSignUp runs:
//    - Calls signUp from AuthContext
//    - AuthContext talks to Supabase
//    - Supabase creates new user account
//    - Supabase sends confirmation email
// 5. Show success message
// 6. Redirect to login page
// 7. User checks email and clicks confirmation link
// 8. User can now log in!