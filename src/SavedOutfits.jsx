// SavedOutfits.jsx - Dedicated page for viewing saved outfits
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import SimpleUpgradeButton from './SimpleUpgradeButton'

function SavedOutfits() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  const [savedOutfits, setSavedOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date') // date, rating

  useEffect(() => {
    loadSavedOutfits()
  }, [user])

  const loadSavedOutfits = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSavedOutfits(data || [])
    } catch (err) {
      console.error('Error loading saved outfits:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteOutfit = async (outfitId) => {
    if (!confirm('Are you sure you want to delete this outfit?')) return
    
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('id', outfitId)
        .eq('user_id', user.id)
      
      if (error) throw error
      loadSavedOutfits()
    } catch (err) {
      console.error('Error deleting outfit:', err)
      alert('Failed to delete outfit')
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  const filteredAndSorted = () => {
    let filtered = filter === 'all' 
      ? savedOutfits 
      : savedOutfits.filter(outfit => outfit.occasion === filter)

    if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating)
    }

    return filtered
  }

  const occasions = ['all', 'casual', 'date', 'interview', 'wedding', 'gym', 'night', 'work', 'beach']

  return (
    <div className="saved-outfits-page">
      <div className="saved-container">
        {/* Header */}
        <div className="saved-header-section">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="header">
            <h1> Saved Outfits</h1>
            <HamburgerMenu />
          </div>
          <p className="subtitle">
            {savedOutfits.length} / {isPremium ? '∞' : '10'} saved outfits
            {!isPremium && savedOutfits.length >= 10 && (
              <span className="limit-warning"> Storage limit reached</span>
            )}
          </p>
        </div>

        {/* Stats & Controls */}
        <div className="saved-controls">
          <div className="controls-left">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Most Recent</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
          
          <div className="saved-count">
            <span className="count-number">{filteredAndSorted().length}</span>
            <span className="count-label">Outfits</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {occasions.map(occ => (
            <button
              key={occ}
              className={`filter-tab ${filter === occ ? 'active' : ''}`}
              onClick={() => setFilter(occ)}
            >
              {occ === 'all' ? 'All' : occ.charAt(0).toUpperCase() + occ.slice(1)}
            </button>
          ))}
        </div>

        {/* Saved Outfits Grid */}
        <div className="saved-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading saved outfits...</p>
            </div>
          ) : filteredAndSorted().length === 0 ? (
            <div className="empty-state">
              <h3>No saved outfits yet</h3>
              <p>Save your favorite outfit ratings to access them anytime!</p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Rate an Outfit
              </button>
            </div>
          ) : (
            <>
              <div className="outfits-grid">
                {filteredAndSorted().map((outfit) => (
                  <div key={outfit.id} className="outfit-card">
                    <div className="outfit-image-wrapper">
                      <img src={outfit.image_data} alt={outfit.name} />
                      <div className="outfit-overlay">
                        <div className="rating-circle-small" style={{ borderColor: getRatingColor(outfit.rating) }}>
                          <span style={{ color: getRatingColor(outfit.rating) }}>
                            {outfit.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="outfit-info">
                      <h3>{outfit.name}</h3>
                      <div className="outfit-meta">
                        <span className="occasion-tag">
                          {outfit.occasion === 'none' ? 'General' : outfit.occasion}
                        </span>
                        <span className="outfit-date">
                          {new Date(outfit.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => deleteOutfit(outfit.id)} 
                        className="btn-delete-outfit"
                      >
                         Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!isPremium && savedOutfits.length >= 8 && (
                <div className="upgrade-prompt-saved">
                  <div className="upgrade-content">
                    <h3>Unlock Unlimited Storage!</h3>
                    <p>Upgrade to Premium to save unlimited outfits and never lose your favorites.</p>
                    <SimpleUpgradeButton text="Upgrade for $5.99/month" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SavedOutfits