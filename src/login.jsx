// 📚 WHAT IS THIS FILE?
// This is the Login page where existing users enter their email and password.
// When they click "Login", we check with Supabase if the credentials are correct.

import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

function Login() {
  // 🎣 HOOKS (special React functions)
  
  // Get the signIn function from our AuthContext
  const { signIn } = useAuth()
  
  // useNavigate lets us send users to different pages
  const navigate = useNavigate()
  
  // 📝 FORM STATE (what user types)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // ⏳ LOADING STATE (show spinner while logging in)
  const [loading, setLoading] = useState(false)
  
  // ❌ ERROR STATE (show error messages)
  const [error, setError] = useState('')

  // 🎬 FUNCTION: Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault() // Stop page from refreshing
    
    // Clear any previous errors
    setError('')
    setLoading(true)

    try {
      // Call our signIn function from AuthContext
      const { data, error } = await signIn(email, password)

      if (error) {
        // Show user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('❌ Wrong email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('📧 Please check your email and confirm your account first.')
        } else {
          setError(`❌ ${error.message}`)
        }
        return
      }

      // Success! Redirect to main app
      navigate('/')
      
    } catch (err) {
      setError('❌ Something went wrong. Please try again.')
      console.error('Login error:', err)
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
          <p>Welcome back! Log in to rate outfits.</p>
        </div>

        {/* 📋 Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
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
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
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
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* 🔗 Link to Sign Up */}
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="link-button"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

// 📖 HOW THIS WORKS:
// 
// 1. User types email and password
// 2. User clicks "Log In" button
// 3. handleLogin function runs:
//    - Calls signIn from AuthContext
//    - AuthContext talks to Supabase
//    - Supabase checks if credentials are correct
// 4. If correct: redirect to main app
//    If wrong: show error message
// 5. AuthContext automatically updates the 'user' state
//    everywhere in the app