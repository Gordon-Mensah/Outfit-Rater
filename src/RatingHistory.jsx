// RatingHistory.jsx - ULTRA FAST VERSION
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'

function RatingHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (user) loadHistory()
  }, [user])

  const loadHistory = async () => {
    setLoading(true)
    try {
      // SPEED: Only get essential fields, limit results
      const { data } = await supabase
        .from('outfit_history')
        .select('id, rating, feedback, occasion, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)  // SPEED: Limit to 100 most recent
      
      if (data && data.length > 0) {
        // Calculate stats quickly
        const total = data.length
        const avg = (data.reduce((acc, item) => acc + item.rating, 0) / total).toFixed(1)
        const best = Math.max(...data.map(item => item.rating))
        setStats({ total, avg, best })
      }
      
      setHistory(data || [])
    } catch (err) {
      console.error('Load error:', err)
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

  const filtered = filter === 'all' 
    ? history 
    : history.filter(item => item.occasion === filter)

  if (!user) return null

  return (
    <div className="rating-history-page">
      <div className="history-container">
        <div className="page-header">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back
          </button>
          <h1>📜 Rating History</h1>
        </div>

        {stats && (
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Ratings</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.avg}</div>
              <div className="stat-label">Average</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.best}</div>
              <div className="stat-label">Best</div>
            </div>
          </div>
        )}

        <div className="filter-tabs">
          {['all', 'casual', 'date', 'interview', 'wedding', 'night', 'work'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No ratings yet</h3>
            <button onClick={() => navigate('/')} className="btn-primary">
              Rate Your First Outfit
            </button>
          </div>
        ) : (
          <div className="history-grid">
            {filtered.map(item => (
              <div key={item.id} className="history-card">
                <div className="history-header">
                  <div className="rating-badge" style={{ background: getRatingColor(item.rating) }}>
                    <span>{getRatingEmoji(item.rating)}</span>
                    <span>{item.rating}/10</span>
                  </div>
                  <div className="history-date">
                    {new Date(item.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div className="history-occasion">
                  {item.occasion === 'none' ? 'General' : item.occasion}
                </div>
                <div className="history-feedback">
                  {item.feedback}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RatingHistory