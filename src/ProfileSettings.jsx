// ProfileSettings.jsx - FIXED: Name persistence issue resolved
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'

function ProfileSettings() {
  const { user, isPremium, signOut } = useAuth()
  const navigate = useNavigate()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('account')
  
  // Account settings
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Stats (lazy loaded)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  
  // UI states
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  // Only load essential data on mount
  useEffect(() => {
    if (user) {
      // Load user profile quickly (minimal data)
      loadUserProfile()
    }
  }, [user])

  // Load stats only when stats tab is active
  useEffect(() => {
    if (activeTab === 'stats' && !stats && !statsLoading) {
      loadStats()
    }
  }, [activeTab])

  // FIXED: Changed from .single() to .maybeSingle()
  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, bio')
        .eq('user_id', user.id)
        .maybeSingle()  // ← FIXED: Changed from .single()
      
      if (data) {
        setDisplayName(data.display_name || '')
        setBio(data.bio || '')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      // Load all stats in parallel for speed
      const [historyResult, savedResult] = await Promise.all([
        supabase
          .from('outfit_history')
          .select('rating, created_at', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('saved_outfits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ])

      const ratings = historyResult.data || []
      const totalRatings = ratings.length
      const avgRating = totalRatings > 0 
        ? (ratings.reduce((acc, item) => acc + item.rating, 0) / totalRatings).toFixed(1)
        : '0.0'
      const bestRating = totalRatings > 0 
        ? Math.max(...ratings.map(item => item.rating))
        : 0

      setStats({
        totalRatings,
        avgRating,
        bestRating,
        savedOutfits: savedResult.count || 0
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  // FIXED: Added onConflict parameter for proper upsert
  const updateProfile = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user.id,
            display_name: displayName,
            bio: bio,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id'  // ← FIXED: Added this parameter!
          }
        )
      
      if (error) throw error
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      console.error('Error updating profile:', err)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Error changing password:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' })
      return
    }

    setLoading(true)
    try {
      // Delete user data
      await Promise.all([
        supabase.from('outfit_history').delete().eq('user_id', user.id),
        supabase.from('saved_outfits').delete().eq('user_id', user.id),
        supabase.from('user_profiles').delete().eq('user_id', user.id),
        supabase.from('daily_ratings').delete().eq('user_id', user.id)
      ])

      // Sign out and redirect
      await signOut()
      navigate('/signup')
    } catch (err) {
      console.error('Error deleting account:', err)
      setMessage({ type: 'error', text: 'Failed to delete account' })
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password) => {
    if (password.length === 0) return null
    if (password.length < 6) return 'weak'
    if (password.length < 10) return 'medium'
    return 'strong'
  }

  const passwordStrength = getPasswordStrength(newPassword)

  if (!user) return null

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1 className="profile-title">Profile Settings</h1>
          <p className="profile-subtitle">Manage your account and preferences</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`message-banner ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✓' : '✕'}
            </span>
            {message.text}
          </div>
        )}

        {/* Account Card */}
        <div className="account-card">
          <div className="account-avatar">
            {user.email.substring(0, 2).toUpperCase()}
          </div>
          <div className="account-details">
            <h2>{displayName || 'User'}</h2>
            <p className="account-email">{user.email}</p>
            <div className="account-badges">
              {isPremium ? (
                <span className="badge premium">⭐ Premium Member</span>
              ) : (
                <span className="badge free">🆓 Free Tier</span>
              )}
              <span className="badge date">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Only show when stats tab is active */}
        {activeTab === 'stats' && (
          <div className="stats-grid">
            {statsLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="stat-card">
                    <div className="spinner"></div>
                  </div>
                ))}
              </>
            ) : stats ? (
              <>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalRatings}</div>
                  <div className="stat-label">Total Ratings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.avgRating}</div>
                  <div className="stat-label">Average Rating</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.bestRating}</div>
                  <div className="stat-label">Best Rating</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.savedOutfits}</div>
                  <div className="stat-label">Saved Outfits</div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Tabs */}
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
          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
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

        {/* Tab Content */}
        <div className="tab-content">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <h3>Account Information</h3>
              <p className="section-description">
                Update your profile information
              </p>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={200}
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

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Change Password</h3>
              <p className="section-description">
                Keep your account secure with a strong password
              </p>

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
                {passwordStrength && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div className={`strength-fill ${passwordStrength}`}></div>
                    </div>
                    <span className={`strength-text ${passwordStrength}`}>
                      {passwordStrength === 'weak' && 'Weak'}
                      {passwordStrength === 'medium' && 'Medium'}
                      {passwordStrength === 'strong' && 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <button
                onClick={changePassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="btn-primary"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>

              {/* Danger Zone */}
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p className="danger-text">
                  Once you delete your account, there is no going back. This will permanently delete all your data.
                </p>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="btn-danger"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p style={{ color: '#991b1b', fontWeight: 600 }}>
                      Type "DELETE" to confirm account deletion:
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
                        {loading ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="settings-section">
              <h3>Your Statistics</h3>
              <p className="section-description">
                Track your outfit rating journey
              </p>
              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading stats...</p>
                </div>
              ) : stats ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ fontSize: '18px', color: '#4b5563' }}>
                    You've rated <strong>{stats.totalRatings}</strong> outfits with an average rating of <strong>{stats.avgRating}/10</strong>!
                  </p>
                  <button onClick={() => navigate('/history')} className="btn-primary" style={{ marginTop: '20px' }}>
                    View Full History
                  </button>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  No statistics available yet. Start rating outfits!
                </p>
              )}
            </div>
          )}

          {/* Premium Tab */}
          {activeTab === 'premium' && !isPremium && (
            <div className="upgrade-card">
              <div className="upgrade-content">
                <h4>Upgrade to Premium</h4>
                <ul>
                  <li>✓ Unlimited outfit ratings per day</li>
                  <li>✓ Unlimited saved outfits</li>
                  <li>✓ Access to all feedback modes (Roast Mode!)</li>
                  <li>✓ Priority customer support</li>
                  <li>✓ Early access to new features</li>
                </ul>
                <button
                  className="btn-upgrade"
                  onClick={() => navigate('/premium')}
                >
                  Upgrade for $4.99/month
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings