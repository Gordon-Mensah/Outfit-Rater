// ProfileSettings.jsx - Enhanced with better UI/UX
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

function ProfileSettings() {
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  
  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [memberSince, setMemberSince] = useState('')
  
  // Statistics state
  const [stats, setStats] = useState({
    totalRatings: 0,
    savedOutfits: 0,
    avgRating: 0,
    favoriteOccasion: 'N/A'
  })
  
  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'security', 'preferences'
  
  useEffect(() => {
    loadUserData()
  }, [user])
  
  useEffect(() => {
    calculatePasswordStrength(newPassword)
  }, [newPassword])
  
  const loadUserData = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    setLoading(true)
    try {
      setEmail(user.email)
      const createdAt = new Date(user.created_at)
      setMemberSince(createdAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }))
      
      // Get profile data (if table exists)
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, bio')
          .eq('user_id', user.id)
          .single()
        
        if (profileData) {
          setDisplayName(profileData.display_name || '')
          setBio(profileData.bio || '')
        }
      } catch (err) {
        console.log('Profiles table might not exist yet')
      }
      
      await loadStatistics()
      
    } catch (error) {
      console.error('Error loading user data:', error)
      showMessage('Error loading profile data', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const loadStatistics = async () => {
    try {
      const { count: ratingsCount } = await supabase
        .from('outfit_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      const { count: savedCount } = await supabase
        .from('saved_outfits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      const { data: ratingsData } = await supabase
        .from('outfit_history')
        .select('rating')
        .eq('user_id', user.id)
      
      let avgRating = 0
      if (ratingsData && ratingsData.length > 0) {
        const sum = ratingsData.reduce((acc, item) => acc + item.rating, 0)
        avgRating = (sum / ratingsData.length).toFixed(1)
      }
      
      const { data: occasionsData } = await supabase
        .from('outfit_history')
        .select('occasion')
        .eq('user_id', user.id)
      
      let favoriteOccasion = 'N/A'
      if (occasionsData && occasionsData.length > 0) {
        const occasionCounts = {}
        occasionsData.forEach(item => {
          occasionCounts[item.occasion] = (occasionCounts[item.occasion] || 0) + 1
        })
        favoriteOccasion = Object.keys(occasionCounts).reduce((a, b) => 
          occasionCounts[a] > occasionCounts[b] ? a : b
        )
        favoriteOccasion = favoriteOccasion.charAt(0).toUpperCase() + favoriteOccasion.slice(1)
      }
      
      setStats({
        totalRatings: ratingsCount || 0,
        savedOutfits: savedCount || 0,
        avgRating: avgRating,
        favoriteOccasion: favoriteOccasion
      })
      
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }
  
  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 10) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5
    setPasswordStrength(Math.min(strength, 100))
  }
  
  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 25) return 'Weak'
    if (passwordStrength < 50) return 'Fair'
    if (passwordStrength < 75) return 'Good'
    return 'Strong'
  }
  
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#ef4444'
    if (passwordStrength < 50) return '#f59e0b'
    if (passwordStrength < 75) return '#eab308'
    return '#10b981'
  }
  
  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }
  
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      showMessage('Profile updated successfully!', 'success')
    } catch (error) {
      console.error('Error saving profile:', error)
      showMessage('Error updating profile', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error')
      return
    }
    
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error')
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      setNewPassword('')
      setConfirmPassword('')
      showMessage('Password updated successfully!', 'success')
    } catch (error) {
      console.error('Error updating password:', error)
      showMessage('Error updating password', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showMessage('Please type DELETE to confirm', 'error')
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      localStorage.clear()
      sessionStorage.clear()
      navigate('/signup')
    } catch (error) {
      console.error('Error deleting account:', error)
      showMessage('Error deleting account', 'error')
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </button>
          <h1 className="profile-title">Profile Settings</h1>
          <p className="profile-subtitle">Manage your account and preferences</p>
        </div>
        
        {/* Message Banner */}
        {message && (
          <div className={`message-banner ${messageType}`}>
            <span className="message-icon">{messageType === 'success' ? '✓' : '⚠'}</span>
            <span>{message}</span>
          </div>
        )}
        
        {/* Account Card */}
        <div className="account-card">
          <div className="account-avatar">
            {email.substring(0, 2).toUpperCase()}
          </div>
          <div className="account-details">
            <h2>{displayName || 'User'}</h2>
            <p className="account-email">{email}</p>
            <div className="account-badges">
              {isPremium ? (
                <span className="badge premium">⭐ Premium</span>
              ) : (
                <span className="badge free">🆓 Free Tier</span>
              )}
              <span className="badge date">📅 Since {memberSince}</span>
            </div>
          </div>
        </div>
        
        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{stats.totalRatings}</div>
            <div className="stat-label">Total Ratings</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-value">{stats.savedOutfits}</div>
            <div className="stat-label">Saved Outfits</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-value">{stats.avgRating || 'N/A'}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats.favoriteOccasion}</div>
            <div className="stat-label">Top Occasion</div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button 
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="tab-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h3>Edit Profile</h3>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={50}
                />
                <span className="char-count">{displayName.length}/50</span>
              </div>
              
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your style..."
                  maxLength={200}
                  rows={4}
                />
                <span className="char-count">{bio.length}/200</span>
              </div>
              
              <button 
                className="btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Profile'}
              </button>
            </div>
          )}
          
          {/* Security Tab */}
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
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                
                {newPassword && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{ 
                          width: `${passwordStrength}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }}
                      />
                    </div>
                    <span style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              
              <button 
                className="btn-primary"
                onClick={handleChangePassword}
                disabled={saving || !newPassword || !confirmPassword}
              >
                {saving ? 'Updating...' : '🔒 Update Password'}
              </button>
              
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p className="danger-text">
                  Once you delete your account, there is no going back.
                </p>
                
                {!showDeleteConfirm ? (
                  <button 
                    className="btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑️ Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>Type <strong>DELETE</strong> to confirm:</p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                    />
                    <div className="confirm-actions">
                      <button 
                        className="btn-cancel"
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || saving}
                      >
                        {saving ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <p className="section-description">
                Customize how you receive updates about your outfit ratings
              </p>
              
              {!isPremium && (
                <div className="upgrade-card">
                  <div className="upgrade-content">
                    <h4>⭐ Upgrade to Premium</h4>
                    <ul>
                      <li>✓ Unlimited ratings per day</li>
                      <li>✓ Unlimited saved outfits</li>
                      <li>✓ All feedback modes (Helpful, Honest, Roast)</li>
                      <li>✓ Priority support</li>
                    </ul>
                    <button 
                      className="btn-upgrade"
                      onClick={() => alert('Premium coming soon! $4.99/month')}
                    >
                      Upgrade Now - $4.99/month
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings