// RatingHistory.jsx - Modern Redesign
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import './RatingHistory.css'

function RatingHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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

  const getRatingLabel = (rating) => {
    if (rating >= 9) return 'Outstanding'
    if (rating >= 7) return 'Great'
    if (rating >= 5) return 'Good'
    return 'Needs Work'
  }

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.occasion === filter)

  const occasions = ['all', 'casual', 'date', 'interview', 'wedding', 'gym', 'night', 'work', 'beach']

  // Calculate stats
  const totalRatings = history.length
  const averageRating = totalRatings > 0 
    ? (history.reduce((acc, item) => acc + item.rating, 0) / totalRatings).toFixed(1)
    : '0.0'
  const bestRating = totalRatings > 0 
    ? Math.max(...history.map(item => item.rating))
    : 0

  return (
    <div className="history-page">
      {/* Background */}
      <div className="history-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Content */}
      <div className="history-content">
        {/* Header */}
        <header className="history-header">
          <button onClick={() => navigate('/rate')} className="back-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M12.5 15l-5-5 5-5" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Back
          </button>
          <div className="header-main">
            <div className="header-left">
              <h1 className="page-title">Rating History</h1>
              <p className="page-subtitle">View all your outfit ratings and feedback</p>
            </div>
            <HamburgerMenu />
          </div>
        </header>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{totalRatings}</div>
                <div className="stat-label">Total Ratings</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{averageRating}</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeWidth="2" strokeLinecap="round"/>
                  <polyline points="17 6 23 6 23 12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{bestRating}</div>
                <div className="stat-label">Best Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="filter-section">
          <div className="filter-label">Filter by occasion:</div>
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
        </section>

        {/* History List */}
        <section className="history-list-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your rating history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="empty-title">No ratings found</h3>
              <p className="empty-description">
                {filter === 'all' 
                  ? "Start rating your outfits to build your history!"
                  : `No ratings for ${filter} occasions yet. Try a different filter or rate a new outfit.`
                }
              </p>
              <button onClick={() => navigate('/rate')} className="btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2"/>
                </svg>
                Rate Your First Outfit
              </button>
            </div>
          ) : (
            <div className="history-grid">
              {filteredHistory.map((item) => (
                <div key={item.id} className="history-card">
                  <div className="card-header">
                    <div 
                      className="rating-badge" 
                      style={{ 
                        background: getRatingColor(item.rating),
                        boxShadow: `0 4px 12px ${getRatingColor(item.rating)}40`
                      }}
                    >
                      <span className="rating-number">{item.rating}</span>
                      <span className="rating-max">/10</span>
                    </div>
                    <div className="rating-label" style={{ color: getRatingColor(item.rating) }}>
                      {getRatingLabel(item.rating)}
                    </div>
                  </div>

                  <div className="card-meta">
                    <div className="occasion-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                      </svg>
                      {item.occasion === 'none' ? 'General' : item.occasion}
                    </div>
                    <div className="date-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                      </svg>
                      {new Date(item.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="card-feedback">
                    <div className="feedback-label">Feedback:</div>
                    <p className="feedback-text">{item.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default RatingHistory