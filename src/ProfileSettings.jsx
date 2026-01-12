// ProfileSettings.jsx - ULTRA FAST VERSION
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'

function ProfileSettings() {
  const { user, isPremium, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('account')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  // SPEED FIX: Only load profile data, skip stats until needed
  useEffect(() => {
    if (user) {
      loadProfileQuickly()
    }
  }, [user])

  const loadProfileQuickly = async () => {
    try {
      // SPEED: Simple select with no joins
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, bio')
        .eq('user_id', user.id)
        .maybeSingle()  // Use maybeSingle() instead of single() to avoid errors
      
      if (data) {
        setDisplayName(data.display_name || '')
        setBio(data.bio || '')
      }
    } catch (err) {
      console.error('Profile load error:', err)
    }
  }

  const updateProfile = async () => {
    setLoading(true)
    setMessage(null)
    try {
      // IMPORTANT: Use upsert to handle both insert and update
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user.id,
            display_name: displayName.trim(),
            bio: bio.trim(),
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id'  // Specify unique column
          }
        )
      
      if (error) throw error
      
      setMessage({ type: 'success', text: '✓ Profile updated successfully!' })
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Update error:', err)
      setMessage({ type: 'error', text: '✕ Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '✕ Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '✕ Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      setMessage({ type: 'success', text: '✓ Password changed successfully!' })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: `✕ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      setMessage({ type: 'error', text: '✕ Please type DELETE to confirm' })
      return
    }

    setLoading(true)
    try {
      // SPEED: Delete in parallel
      await Promise.all([
        supabase.from('outfit_history').delete().eq('user_id', user.id),
        supabase.from('saved_outfits').delete().eq('user_id', user.id),
        supabase.from('user_profiles').delete().eq('user_id', user.id)
      ])

      await signOut()
      navigate('/signup')
    } catch (err) {
      setMessage({ type: 'error', text: '✕ Failed to delete account' })
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password) => {
    if (!password) return null
    if (password.length < 6) return 'weak'
    if (password.length < 10) return 'medium'
    return 'strong'
  }

  if (!user) return null

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back
          </button>
          <h1>Profile Settings</h1>
        </div>

        {message && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="account-card">
          <div className="account-avatar">
            {(displayName || user.email).substring(0, 2).toUpperCase()}
          </div>
          <div className="account-details">
            <h2>{displayName || 'User'}</h2>
            <p className="account-email">{user.email}</p>
            <span className={`badge ${isPremium ? 'premium' : 'free'}`}>
              {isPremium ? '⭐ Premium' : '🆓 Free'}
            </span>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
          <button
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          {!isPremium && (
            <button
              className={`tab ${activeTab === 'premium' ? 'active' : ''}`}
              onClick={() => setActiveTab('premium')}
            >
              Premium
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'account' && (
            <div className="settings-section">
              <h3>Account Information</h3>
              
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={50}
                />
                <span className="char-count">{displayName.length}/50</span>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                  rows={3}
                />
                <span className="char-count">{bio.length}/200</span>
              </div>

              <button
                onClick={updateProfile}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Change Password</h3>
              
              <div className="form-group">
                <label>New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {getPasswordStrength(newPassword) && (
                  <div className={`password-strength ${getPasswordStrength(newPassword)}`}>
                    {getPasswordStrength(newPassword)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>

              <button
                onClick={changePassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="btn-primary"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p className="danger-text">
                  Permanently delete your account and all data.
                </p>
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)} className="btn-danger">
                    Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p style={{ color: '#dc2626', fontWeight: 600 }}>
                      Type "DELETE" to confirm:
                    </p>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="Type DELETE"
                    />
                    <div className="confirm-actions">
                      <button
                        onClick={() => {
                          setDeleteConfirm(false)
                          setDeleteInput('')
                        }}
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={deleteAccount}
                        disabled={loading || deleteInput !== 'DELETE'}
                        className="btn-danger"
                      >
                        {loading ? 'Deleting...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'premium' && !isPremium && (
            <div className="upgrade-card">
              <h4>⭐ Upgrade to Premium</h4>
              <ul>
                <li>✓ Unlimited daily ratings</li>
                <li>✓ Unlimited saved outfits</li>
                <li>✓ All feedback modes</li>
                <li>✓ Priority support</li>
              </ul>
              <div className="price">$4.99/month</div>
              <button
                className="btn-upgrade"
                onClick={() => alert('Premium coming soon!')}
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings