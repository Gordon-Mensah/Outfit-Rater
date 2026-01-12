// SavedOutfits.jsx - ULTRA FAST VERSION
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'

function SavedOutfits() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  const [outfits, setOutfits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) loadOutfits()
  }, [user])

  const loadOutfits = async () => {
    setLoading(true)
    try {
      // SPEED: Only get essential fields, no unnecessary joins
      const { data } = await supabase
        .from('saved_outfits')
        .select('id, name, image_data, rating, occasion, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)  // SPEED: Limit results
      
      setOutfits(data || [])
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteOutfit = async (id) => {
    if (!confirm('Delete this outfit?')) return
    
    try {
      await supabase.from('saved_outfits').delete().eq('id', id)
      setOutfits(outfits.filter(o => o.id !== id))
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  const filtered = filter === 'all' 
    ? outfits 
    : outfits.filter(o => o.occasion === filter)

  if (!user) return null

  return (
    <div className="saved-outfits-page">
      <div className="saved-container">
        <div className="page-header">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back
          </button>
          <h1> Saved Outfits</h1>
          <p>{outfits.length}/{isPremium ? '∞' : '10'}</p>
        </div>

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
            <h3>No saved outfits</h3>
            <button onClick={() => navigate('/')} className="btn-primary">
              Rate an Outfit
            </button>
          </div>
        ) : (
          <div className="outfits-grid">
            {filtered.map(outfit => (
              <div key={outfit.id} className="outfit-card">
                <div className="outfit-image">
                  <img src={outfit.image_data} alt={outfit.name} loading="lazy" />
                  <div className="outfit-rating" style={{ borderColor: getRatingColor(outfit.rating) }}>
                    {outfit.rating}
                  </div>
                </div>
                <div className="outfit-info">
                  <h3>{outfit.name}</h3>
                  <span className="outfit-occasion">{outfit.occasion}</span>
                  <button onClick={() => deleteOutfit(outfit.id)} className="btn-delete">
                     Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedOutfits