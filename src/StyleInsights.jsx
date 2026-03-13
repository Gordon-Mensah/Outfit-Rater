// StyleInsights.jsx - FIXED: Removed emojis from headings
import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import { getInsightMessage, analyzeStyleProfile } from './styleMemory'
import './StyleInsights.css'

function StyleInsights({ onGeneratePersonalized }) {
  const { user } = useAuth()
  const [styleProfile, setStyleProfile] = useState(null)
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFull, setShowFull] = useState(false)

  useEffect(() => {
    if (user) {
      loadStyleProfile()
    }
  }, [user])

  const loadStyleProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('style_profile')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      
      if (data?.style_profile) {
        setStyleProfile(data.style_profile)
        const message = getInsightMessage(data.style_profile)
        setInsight(message)
      }
    } catch (err) {
      console.error('Error loading style profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !insight) {
    return null
  }

  const analysis = styleProfile ? analyzeStyleProfile(styleProfile) : null

  // FIXED: Get level indicator without emoji
  const getLevelIndicator = (level) => {
    const indicators = {
      expert: '●●●',
      intermediate: '●●○',
      beginner: '●○○'
    }
    return indicators[level] || '●○○'
  }

  return (
    <div className="style-insights-container">
      {/* Compact View */}
      {!showFull && (
        <div className="style-insights-compact" onClick={() => setShowFull(true)}>
          <div className="insight-header">
            {/* FIXED: Removed emoji, using level indicator */}
            <div className="insight-icon insight-level">{getLevelIndicator(insight.level)}</div>
            <div className="insight-content">
              {/* FIXED: Removed emoji from title */}
              <h4>{insight.title.replace(/🎯|🧠|🌱/g, '').trim()}</h4>
              <p>{insight.message}</p>
            </div>
            <button className="expand-btn">View Details →</button>
          </div>
          
          {insight.level !== 'beginner' && (
            <div className="quick-stats">
              <span className="stat-pill">
                {styleProfile.stats.learningScore}% learned
              </span>
              {analysis && analysis.topColors.length > 0 && (
                <span className="stat-pill">
                  Loves: {analysis.topColors.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full View */}
      {showFull && (
        <div className="style-insights-full">
          <div className="insights-header-full">
            <div>
              {/* FIXED: Removed emoji from heading */}
              <h2>{insight.title.replace(/🎯|🧠|🌱/g, '').trim()}</h2>
              <p className="insights-subtitle">Based on your wardrobe activity</p>
            </div>
            <button className="close-btn" onClick={() => setShowFull(false)}>×</button>
          </div>

          <div className="insights-body">
            {/* Learning Progress */}
            <div className="insight-section">
              {/* FIXED: Removed emoji from heading */}
              <h3>Learning Progress</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${styleProfile.stats.learningScore}%` }}
                ></div>
              </div>
              <p className="progress-label">{styleProfile.stats.learningScore}% of your style understood</p>
              
              <div className="activity-stats">
                <div className="activity-stat">
                  <span className="activity-value">{styleProfile.stats.totalLikes}</span>
                  <span className="activity-label">Likes</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-value">{styleProfile.stats.totalWears}</span>
                  <span className="activity-label">Wears</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-value">{styleProfile.stats.totalUploads}</span>
                  <span className="activity-label">Uploads</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-value">{styleProfile.stats.totalDeletes}</span>
                  <span className="activity-label">Removes</span>
                </div>
              </div>
            </div>

            {/* Color Preferences */}
            {analysis && analysis.topColors.length > 0 && (
              <div className="insight-section">
                {/* FIXED: Removed emoji from heading */}
                <h3>Color Preferences</h3>
                <div className="color-grid">
                  <div className="color-group">
                    <h4>Loves</h4>
                    <div className="color-tags">
                      {analysis.topColors.map(color => (
                        <span key={color} className="color-tag loved">
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                  {analysis.avoidedColors.length > 0 && (
                    <div className="color-group">
                      <h4>Avoids</h4>
                      <div className="color-tags">
                        {analysis.avoidedColors.map(color => (
                          <span key={color} className="color-tag avoided">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Style Pattern */}
            {analysis && (analysis.stylePattern || analysis.preferredSilhouette) && (
              <div className="insight-section">
                {/* FIXED: Removed emoji from heading */}
                <h3>Style DNA</h3>
                <div className="dna-grid">
                  {analysis.stylePattern && (
                    <div className="dna-card">
                      <div className="dna-info">
                        <span className="dna-label">Pattern</span>
                        <span className="dna-value">{analysis.stylePattern}</span>
                      </div>
                    </div>
                  )}
                  {analysis.preferredSilhouette && (
                    <div className="dna-card">
                      <div className="dna-info">
                        <span className="dna-label">Fit</span>
                        <span className="dna-value">{analysis.preferredSilhouette}</span>
                      </div>
                    </div>
                  )}
                  {analysis.favoriteOccasion && (
                    <div className="dna-card">
                      <div className="dna-info">
                        <span className="dna-label">Occasion</span>
                        <span className="dna-value">{analysis.favoriteOccasion}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insight.recommendations && insight.recommendations.length > 0 && (
              <div className="insight-section">
                {/* FIXED: Removed emoji from heading */}
                <h3>Personalized Suggestions</h3>
                <div className="recommendations-list">
                  {insight.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-card">
                      <p className="rec-message">{rec.message}</p>
                      <button 
                        className="rec-action-btn"
                        onClick={() => onGeneratePersonalized && onGeneratePersonalized(rec)}
                      >
                        Generate Now →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="insights-footer">
            <p className="insights-note">
              Your style profile updates automatically as you use the app!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StyleInsights
