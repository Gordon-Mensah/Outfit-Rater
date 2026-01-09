import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

function ProfileSettings() {
  const navigate = useNavigate();
  const { user, userTier, logout } = useAuth();
  
  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  
  // Statistics state
  const [stats, setStats] = useState({
    totalRatings: 0,
    savedOutfits: 0,
    avgRating: 0,
    favoriteOccasion: 'N/A'
  });
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, [user]);
  
  // Calculate password strength
  useEffect(() => {
    calculatePasswordStrength(newPassword);
  }, [newPassword]);
  
  const loadUserData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      // Get user email and creation date
      setEmail(user.email);
      const createdAt = new Date(user.created_at);
      setMemberSince(createdAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
      
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
      }
      
      // Get statistics
      await loadStatistics();
      
    } catch (error) {
      console.error('Error loading user data:', error);
      showMessage('Error loading profile data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const loadStatistics = async () => {
    try {
      // Get total ratings
      const { count: ratingsCount } = await supabase
        .from('outfit_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // Get saved outfits count
      const { count: savedCount } = await supabase
        .from('saved_outfits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // Get average rating
      const { data: ratingsData } = await supabase
        .from('outfit_history')
        .select('rating')
        .eq('user_id', user.id);
      
      let avgRating = 0;
      if (ratingsData && ratingsData.length > 0) {
        const sum = ratingsData.reduce((acc, item) => acc + item.rating, 0);
        avgRating = (sum / ratingsData.length).toFixed(1);
      }
      
      // Get favorite occasion
      const { data: occasionsData } = await supabase
        .from('outfit_history')
        .select('occasion')
        .eq('user_id', user.id);
      
      let favoriteOccasion = 'N/A';
      if (occasionsData && occasionsData.length > 0) {
        const occasionCounts = {};
        occasionsData.forEach(item => {
          occasionCounts[item.occasion] = (occasionCounts[item.occasion] || 0) + 1;
        });
        favoriteOccasion = Object.keys(occasionCounts).reduce((a, b) => 
          occasionCounts[a] > occasionCounts[b] ? a : b
        );
        // Capitalize first letter
        favoriteOccasion = favoriteOccasion.charAt(0).toUpperCase() + favoriteOccasion.slice(1);
      }
      
      setStats({
        totalRatings: ratingsCount || 0,
        savedOutfits: savedCount || 0,
        avgRating: avgRating,
        favoriteOccasion: favoriteOccasion
      });
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };
  
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    setPasswordStrength(Math.min(strength, 100));
  };
  
  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };
  
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#ef4444';
    if (passwordStrength < 50) return '#f59e0b';
    if (passwordStrength < 75) return '#eab308';
    return '#10b981';
  };
  
  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };
  
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      showMessage('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setNewPassword('');
      setConfirmPassword('');
      showMessage('Password updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('Error updating password', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showMessage('Please type DELETE to confirm', 'error');
      return;
    }
    
    setSaving(true);
    try {
      // Delete user data from database (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
      
      // Sign out
      await logout();
      navigate('/signup');
    } catch (error) {
      console.error('Error deleting account:', error);
      showMessage('Error deleting account. Please contact support.', 'error');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to App
        </button>
        <h1>Profile Settings</h1>
      </div>
      
      {/* Message Banner */}
      {message && (
        <div className={`message-banner ${messageType}`}>
          {message}
        </div>
      )}
      
      {/* Account Overview */}
      <section className="settings-section">
        <h2>Account Overview</h2>
        <div className="account-info">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Account Tier:</span>
            <span className={`tier-badge ${userTier}`}>
              {userTier === 'premium' ? '⭐ Premium' : 'Free'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Member Since:</span>
            <span className="info-value">{memberSince}</span>
          </div>
        </div>
        
        {userTier === 'free' && (
          <button 
            className="upgrade-button"
            onClick={() => navigate('/pricing')}
          >
            Upgrade to Premium
          </button>
        )}
      </section>
      
      {/* Statistics Dashboard */}
      <section className="settings-section">
        <h2>Your Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalRatings}</div>
            <div className="stat-label">Total Ratings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.savedOutfits}</div>
            <div className="stat-label">Saved Outfits</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.avgRating || 'N/A'}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.favoriteOccasion}</div>
            <div className="stat-label">Favorite Occasion</div>
          </div>
        </div>
      </section>
      
      {/* Profile Editor */}
      <section className="settings-section">
        <h2>Edit Profile</h2>
        <div className="form-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={50}
          />
          <span className="char-counter">{displayName.length}/50</span>
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about your style..."
            maxLength={200}
            rows={4}
          />
          <span className="char-counter">{bio.length}/200</span>
        </div>
        
        <button 
          className="save-button"
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </section>
      
      {/* Password Change */}
      <section className="settings-section">
        <h2>Change Password</h2>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
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
              <span 
                className="strength-label"
                style={{ color: getPasswordStrengthColor() }}
              >
                {getPasswordStrengthLabel()}
              </span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
        
        <button 
          className="save-button"
          onClick={handleChangePassword}
          disabled={saving || !newPassword || !confirmPassword}
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </section>
      
      {/* Preferences */}
      <section className="settings-section">
        <h2>Preferences</h2>
        <div className="preference-item">
          <div className="preference-info">
            <strong>Email Notifications</strong>
            <p>Receive notifications about your outfit ratings</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="preference-item">
          <div className="preference-info">
            <strong>Weekly Summary</strong>
            <p>Get a weekly summary of your style trends</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={weeklySummary}
              onChange={(e) => setWeeklySummary(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>
      
      {/* Danger Zone */}
      <section className="settings-section danger-zone">
        <h2>Danger Zone</h2>
        <p className="danger-warning">
          Once you delete your account, there is no going back. This action cannot be undone.
        </p>
        
        {!showDeleteConfirm ? (
          <button 
            className="delete-button"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <div className="delete-confirm">
            <p>Type <strong>DELETE</strong> to confirm account deletion:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
            />
            <div className="confirm-buttons">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || saving}
              >
                {saving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProfileSettings;