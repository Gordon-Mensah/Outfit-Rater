// CompareResult.jsx - Dedicated page for outfit comparison results
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function CompareResult() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Get result data from navigation state
  const { 
    ratings, 
    bestIndex, 
    analysis, 
    mixSuggestion,
    images,
    occasion 
  } = location.state || {}

  const [selectedView, setSelectedView] = useState('all') // 'all', 'best', 'worst'

  // If no data, redirect back
  if (!ratings || !images) {
    navigate('/')
    return null
  }

  // Get rating color
  const getRatingColor = (rating) => {
    if (rating >= 9) return '#8b5cf6'
    if (rating >= 7) return '#10b981'
    if (rating >= 4) return '#f59e0b'
    return '#ef4444'
  }

  // Get medal emoji
  const getMedal = (index) => {
    if (index === bestIndex) return '🥇'
    const sortedIndices = ratings
      .map((r, i) => ({ rating: r, index: i }))
      .sort((a, b) => b.rating - a.rating)
    
    if (sortedIndices[1]?.index === index) return '🥈'
    if (sortedIndices[2]?.index === index) return '🥉'
    return ''
  }

  // Get worst outfit index
  const worstIndex = ratings.indexOf(Math.min(...ratings))

  // Share comparison
  const shareComparison = () => {
    const text = `I compared ${images.length} outfits! Best scored ${ratings[bestIndex]}/10 🎉`
    const url = window.location.origin

    if (navigator.share) {
      navigator.share({ 
        title: 'My Outfit Comparison',
        text: text,
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(`${text} ${url}`)
        alert('Comparison copied to clipboard!')
      })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      alert('Comparison copied to clipboard!')
    }
  }

  // Filter outfits based on view
  const getFilteredOutfits = () => {
    if (selectedView === 'best') {
      return [{ image: images[bestIndex], rating: ratings[bestIndex], index: bestIndex }]
    } else if (selectedView === 'worst') {
      return [{ image: images[worstIndex], rating: ratings[worstIndex], index: worstIndex }]
    }
    return images.map((img, i) => ({ image: img, rating: ratings[i], index: i }))
  }

  return (
    <div className="compare-result-page">
      <div className="compare-container">
        {/* Header */}
        <div className="result-header-section">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Home
          </button>
          <h1>Comparison Results</h1>
          <p className="subtitle">Analyzed {images.length} outfits</p>
        </div>

        {/* Winner Spotlight */}
        <div className="winner-spotlight">
          <div className="spotlight-badge">
            <span className="crown-icon">👑</span>
            <h2>Best Choice</h2>
          </div>
          
          <div className="winner-card">
            <div className="winner-image-container">
              <img 
                src={images[bestIndex]} 
                alt="Best outfit" 
                className="winner-image"
              />
              <div className="winner-overlay">
                <span className="winner-medal">🥇</span>
              </div>
            </div>
            
            <div className="winner-info">
              <div className="winner-rating">
                <span 
                  className="winner-score"
                  style={{ color: getRatingColor(ratings[bestIndex]) }}
                >
                  {ratings[bestIndex]}
                </span>
                <span className="winner-denominator">/10</span>
              </div>
              <p className="winner-label">Outfit {bestIndex + 1}</p>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        {analysis && (
          <div className="analysis-section">
            <h3>🔍 Detailed Analysis</h3>
            <div className="analysis-content">
              <p>{analysis}</p>
            </div>
          </div>
        )}

        {/* Mix & Match Suggestion */}
        {mixSuggestion && (
          <div className="mix-match-section">
            <h3>✨ Mix & Match Suggestion</h3>
            <div className="mix-match-content">
              <span className="mix-icon">🎨</span>
              <p>{mixSuggestion}</p>
            </div>
          </div>
        )}

        {/* View Selector */}
        <div className="view-selector">
          <button
            className={selectedView === 'all' ? 'active' : ''}
            onClick={() => setSelectedView('all')}
          >
            All Outfits ({images.length})
          </button>
          <button
            className={selectedView === 'best' ? 'active' : ''}
            onClick={() => setSelectedView('best')}
          >
            🥇 Best
          </button>
          <button
            className={selectedView === 'worst' ? 'active' : ''}
            onClick={() => setSelectedView('worst')}
          >
            Needs Work
          </button>
        </div>

        {/* All Outfits Grid */}
        <div className="outfits-comparison-grid">
          {getFilteredOutfits().map(({ image, rating, index }) => (
            <div 
              key={index} 
              className={`comparison-outfit-card ${index === bestIndex ? 'is-best' : ''} ${index === worstIndex ? 'is-worst' : ''}`}
            >
              <div className="outfit-card-header">
                <span className="outfit-number">Outfit {index + 1}</span>
                <span className="outfit-medal">{getMedal(index)}</span>
              </div>
              
              <div className="outfit-card-image">
                <img src={image} alt={`Outfit ${index + 1}`} />
                {index === bestIndex && (
                  <div className="best-badge">Best Choice!</div>
                )}
              </div>
              
              <div className="outfit-card-rating">
                <div 
                  className="rating-bar"
                  style={{ 
                    width: `${(rating / 10) * 100}%`,
                    backgroundColor: getRatingColor(rating)
                  }}
                ></div>
                <span 
                  className="rating-value"
                  style={{ color: getRatingColor(rating) }}
                >
                  {rating}/10
                </span>
              </div>

              {/* Quick insights */}
              <div className="outfit-insights">
                {rating >= 8 && <span className="insight-tag success">Great!</span>}
                {rating >= 6 && rating < 8 && <span className="insight-tag good">Good</span>}
                {rating < 6 && <span className="insight-tag improve">Could improve</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Ranking Summary */}
        <div className="ranking-summary">
          <h3>📊 Final Rankings</h3>
          <div className="ranking-list">
            {ratings
              .map((rating, index) => ({ rating, index }))
              .sort((a, b) => b.rating - a.rating)
              .map((item, rank) => (
                <div key={item.index} className="ranking-item">
                  <span className="rank-number">#{rank + 1}</span>
                  <span className="rank-outfit">Outfit {item.index + 1}</span>
                  <span className="rank-medal">{getMedal(item.index)}</span>
                  <div className="rank-bar-container">
                    <div 
                      className="rank-bar"
                      style={{ 
                        width: `${(item.rating / 10) * 100}%`,
                        backgroundColor: getRatingColor(item.rating)
                      }}
                    ></div>
                  </div>
                  <span 
                    className="rank-score"
                    style={{ color: getRatingColor(item.rating) }}
                  >
                    {item.rating}/10
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="compare-actions">
          <button 
            onClick={shareComparison} 
            className="btn-action btn-share"
          >
            📤 Share Results
          </button>

          <button 
            onClick={() => navigate('/', { state: { mode: 'compare' } })} 
            className="btn-action btn-compare-again"
          >
            🔄 Compare More Outfits
          </button>

          <button 
            onClick={() => navigate('/', { state: { mode: 'single' } })} 
            className="btn-action btn-rate-single"
          >
            Rate Single Outfit
          </button>
        </div>

        {/* Tips for Improvement */}
        <div className="improvement-tips">
          <h3>💡 Tips for Your Lowest-Rated Outfit</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-icon">📏</span>
              <h4>Check the Fit</h4>
              <p>Ensure clothes fit properly - not too tight or loose</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🎨</span>
              <h4>Color Coordination</h4>
              <p>Use complementary or analogous color schemes</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">👔</span>
              <h4>Occasion Match</h4>
              <p>Dress appropriately for the event</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">✨</span>
              <h4>Details Matter</h4>
              <p>Pay attention to accessories and grooming</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompareResult