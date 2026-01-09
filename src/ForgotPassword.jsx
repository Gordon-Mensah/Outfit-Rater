import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link sent! Check your email.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-branding">
          <div className="gradient-bg"></div>
          <div className="branding-content">
            <h1>AI Outfit Rater</h1>
            <p>Reset your password to continue rating outfits with AI</p>
            <div className="feature-list">
              <div className="feature-item">AI-Powered Analysis</div>
              <div className="feature-item">Personalized Feedback</div>
              <div className="feature-item">Save Your Favorites</div>
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form">
            <h2>Reset Password</h2>
            <p className="subtitle">Enter your email to receive a reset link</p>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-links">
              <button onClick={() => navigate('/login')} className="link-btn">
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;