// CheckEmail.jsx - Shown after successful signup

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'

function CheckEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [resendStatus, setResendStatus] = useState('idle') // idle | sending | sent | error

  const handleResend = async () => {
    if (!email) return
    setResendStatus('sending')
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setResendStatus('sent')
      setTimeout(() => setResendStatus('idle'), 5000)
    } catch (err) {
      console.error('Resend error:', err)
      setResendStatus('error')
      setTimeout(() => setResendStatus('idle'), 4000)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="auth-content">
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

        <div className="auth-card">
          <div className="auth-header">

            {/* Email icon */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              position: 'relative',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 7l10 7 10-7"/>
              </svg>
              {/* green dot */}
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '14px',
                height: '14px',
                background: '#22c55e',
                borderRadius: '50%',
                border: '2px solid var(--auth-card-bg, #1a1a2e)',
              }} />
            </div>

            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-subtitle">
              We sent a confirmation link to
            </p>
            {email && (
              <p style={{
                fontWeight: '600',
                fontSize: '0.95rem',
                marginTop: '4px',
                wordBreak: 'break-all',
              }}>
                {email}
              </p>
            )}
          </div>

          {/* Info box */}
          <div className="success-message" style={{ marginBottom: '1.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ lineHeight: '1.6', fontSize: '0.9rem' }}>
              Click the link in the email to activate your account.
              <br />
              Don't see it? Check your <strong>spam or junk</strong> folder.
            </div>
          </div>

          {/* Resend button */}
          {email && (
            <button
              onClick={handleResend}
              disabled={resendStatus === 'sending' || resendStatus === 'sent'}
              className="auth-submit-btn"
              style={{ marginBottom: '1rem' }}
            >
              {resendStatus === 'idle' && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Resend confirmation email
                </>
              )}
              {resendStatus === 'sending' && (
                <>
                  <span className="btn-spinner"></span>
                  Sending...
                </>
              )}
              {resendStatus === 'sent' && (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Sent! Check your inbox
                </>
              )}
              {resendStatus === 'error' && '⚠️ Failed to resend — try again'}
            </button>
          )}

          <div className="auth-footer">
            <p className="footer-text">
              Already confirmed?{' '}
              <button
                onClick={() => navigate('/login')}
                className="link-btn"
                style={{ fontWeight: '700', textDecoration: 'underline' }}
              >
                Sign in now →
              </button>
            </p>
            <p className="footer-text" style={{ marginTop: '8px' }}>
              Wrong email?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="link-btn"
              >
                Sign up again
              </button>
            </p>
          </div>
        </div>

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

export default CheckEmail