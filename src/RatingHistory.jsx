// RatingHistory.jsx - Dedicated page for viewing rating history
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import SimpleUpgradeButton from './SimpleUpgradeButton'

function RatingHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, casual, date, interview, etc.

  useEffect(() => {
    loadHistory()
  }, [user])

  const loadHistory = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('outfit_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Error loading history:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  const getRatingEmoji = (rating) => {
    if (rating >= 9) return '🔥'
    if (rating >= 7) return '😊'
    if (rating >= 4) return '😐'
    return '😬'
  }

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.occasion === filter)

  const occasions = ['all', 'casual', 'date', 'interview', 'wedding', 'gym', 'night', 'work', 'beach']

  return (
    <div className="rating-history-page">
      <div className="history-container">
        {/* Header */}
        <div className="history-header-section">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="header">
            <h1>Rating History</h1>
            <HamburgerMenu />
          </div>
          <p className="subtitle">View all your outfit ratings and feedback</p>
        </div>

        {/* Stats Cards */}
        <div className="history-stats">
          <div className="stat-card">
            <div className="stat-value">{history.length}</div>
            <div className="stat-label">Total Ratings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {history.length > 0 
                ? (history.reduce((acc, item) => acc + item.rating, 0) / history.length).toFixed(1)
                : '0.0'
              }
            </div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {history.length > 0 ? Math.max(...history.map(item => item.rating)) : '0'}
            </div>
            <div className="stat-label">Best Rating</div>
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

        {/* History List */}
        <div className="history-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No ratings yet</h3>
              <p>Start rating your outfits to see your history here!</p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Rate Your First Outfit
              </button>
            </div>
          ) : (
            <div className="history-grid">
              {filteredHistory.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="history-card-header">
                    <div className="rating-badge" style={{ background: getRatingColor(item.rating) }}>
                      <span className="rating-emoji">{getRatingEmoji(item.rating)}</span>
                      <span className="rating-score">{item.rating}/10</span>
                    </div>
                    <div className="history-date">
                      {new Date(item.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                  
                  <div className="history-occasion-tag">
                    {item.occasion === 'none' ? 'General' : item.occasion}
                  </div>
                  
                  <div className="history-feedback">
                    <p>{item.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RatingHistory