// AIClosetSimulator.jsx - Save in your src folder
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import SimpleUpgradeButton from './SimpleUpgradeButton'
import './AIClosetSimulator.css'

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function AIClosetSimulator() {
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  
  const [productImage, setProductImage] = useState(null)
  const [productPreview, setProductPreview] = useState(null)
  const [productCategory, setProductCategory] = useState('tops')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProductImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setProductPreview(reader.result)
    reader.readAsDataURL(file)
    setError(null)
    setAnalysis(null)
  }

  const analyzeProduct = async () => {
    if (!productImage) {
      setError('Please upload a product image first')
      return
    }

    if (!isPremium) {
      setError('AI Closet Simulator is a Premium feature')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      // Get user's wardrobe
      const { data: wardrobeData, error: wardrobeError } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)

      if (wardrobeError) throw wardrobeError

      // Convert product image to base64
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(productImage)
      })

      // Call AI API to analyze the product
      const response = await fetch(`${API_BASE_URL}/api/analyze-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImage: base64Image,
          category: productCategory,
          wardrobeItems: wardrobeData || [],
          userId: user.id
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysis(data)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze product')
    } finally {
      setAnalyzing(false)
    }
  }

  const resetSimulator = () => {
    setProductImage(null)
    setProductPreview(null)
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="simulator-page">
      {/* Animated Background */}
      <div className="landing-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="simulator-content">
        {/* Header */}
        <div className="simulator-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="header">
            <div className="header-text">
              <h1 className="page-title">
                AI Closet Simulator
                {isPremium && <span className="premium-indicator">Premium</span>}
              </h1>
              <p className="page-subtitle">
                Try new items before buying them with AI-powered wardrobe intelligence
              </p>
            </div>
            <HamburgerMenu />
          </div>
        </div>

        {/* Premium Lock Overlay */}
        {!isPremium && (
          <div className="premium-lock-overlay">
            <div className="lock-content">
              <h2>Premium Feature</h2>
              <p>AI Closet Simulator is available exclusively for Premium members</p>
              <div className="lock-features">
                <div className="lock-feature">✓ Wardrobe compatibility analysis</div>
                <div className="lock-feature">✓ Outfit creation potential</div>
                <div className="lock-feature">✓ Color palette impact</div>
                <div className="lock-feature">✓ Wear frequency prediction</div>
                <div className="lock-feature">✓ Style DNA matching</div>
              </div>
              <div className="lock-buttons">
                <SimpleUpgradeButton 
                  text="Upgrade to Premium"
                  className="lock-upgrade-btn"
                />
                <button 
                  onClick={() => navigate('/rate')}
                  className="lock-back-btn"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`simulator-main ${!isPremium ? 'blurred' : ''}`}>
          {!analysis ? (
            // Upload & Configure Section
            <div className="upload-section">
              <div className="upload-card">
                <h2 className="section-title">
                  Upload Product Photo
                </h2>
                <p className="section-description">
                  Upload an image of the item you're considering buying
                </p>

                <div className="upload-zone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="product-upload"
                    style={{ display: 'none' }}
                    disabled={!isPremium}
                  />
                  <label htmlFor="product-upload" className="upload-label">
                    {productPreview ? (
                      <img src={productPreview} alt="Product" className="product-preview" />
                    ) : (
                      <>
                        <p className="upload-text">Click to upload product image</p>
                        <p className="upload-hint">PNG, JPG up to 10MB</p>
                      </>
                    )}
                  </label>
                </div>

                {productPreview && (
                  <div className="category-selector">
                    <label htmlFor="category">Product Category:</label>
                    <select
                      id="category"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      disabled={!isPremium}
                    >
                      <option value="tops">Tops</option>
                      <option value="bottoms">Bottoms</option>
                      <option value="shoes">Shoes</option>
                      <option value="outerwear">Outerwear</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button
                  onClick={analyzeProduct}
                  disabled={!productImage || analyzing || !isPremium}
                  className="btn-analyze-product"
                >
                  {analyzing ? (
                    <>
                      <span className="spinner-small"></span>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <span> Analyze Product</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info Cards */}
              <div className="info-grid">
                <div className="info-card">
                  <h3>Wardrobe Fit</h3>
                  <p>See how this item complements your existing wardrobe</p>
                </div>
                <div className="info-card">
                  <h3>Outfit Potential</h3>
                  <p>Discover how many new outfits you can create</p>
                </div>
                <div className="info-card">
                  <h3>Color Impact</h3>
                  <p>Analyze how it affects your color palette</p>
                </div>
                <div className="info-card">
                  <h3>Wear Prediction</h3>
                  <p>AI predicts how often you'll actually wear it</p>
                </div>
              </div>
            </div>
          ) : (
            // Analysis Results Section
            <div className="results-section">
              <div className="results-header">
                <h2 className="section-title">
                  AI Analysis Results
                </h2>
                <button onClick={resetSimulator} className="btn-reset">
                  Try Another Item
                </button>
              </div>

              {/* Overall Score */}
              <div className="score-card">
                <div className="score-circle" style={{
                  borderColor: analysis.overallScore >= 80 ? '#10b981' :
                               analysis.overallScore >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  <div className="score-number">{analysis.overallScore}</div>
                  <div className="score-label">Match Score</div>
                </div>
                <div className="score-verdict">
                  <h3 className="verdict-title">{analysis.verdict}</h3>
                  <p className="verdict-text">{analysis.verdictReason}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Wardrobe Compatibility</span>
                  </div>
                  <div className="metric-value">{analysis.wardrobeCompatibility}%</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ 
                        width: `${analysis.wardrobeCompatibility}%`,
                        background: analysis.wardrobeCompatibility >= 70 ? '#10b981' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                  <p className="metric-description">{analysis.compatibilityReason}</p>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">New Outfits Created</span>
                  </div>
                  <div className="metric-value">{analysis.newOutfitsCount}</div>
                  <p className="metric-description">
                    You can create {analysis.newOutfitsCount} new outfit combinations with this item
                  </p>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Predicted Monthly Wears</span>
                  </div>
                  <div className="metric-value">{analysis.predictedWears}x</div>
                  <p className="metric-description">{analysis.wearFrequencyReason}</p>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Color Palette Impact</span>
                  </div>
                  <div className="metric-value">{analysis.colorImpact}</div>
                  <p className="metric-description">{analysis.colorImpactReason}</p>
                </div>
              </div>

              {/* Outfit Suggestions */}
              {analysis.outfitSuggestions && analysis.outfitSuggestions.length > 0 && (
                <div className="suggestions-section">
                  <h3 className="suggestions-title">
                    Outfit Combinations You Can Create
                  </h3>
                  <div className="suggestions-grid">
                    {analysis.outfitSuggestions.map((outfit, index) => (
                      <div key={index} className="suggestion-card">
                        <div className="suggestion-number">#{index + 1}</div>
                        <h4 className="suggestion-occasion">{outfit.occasion}</h4>
                        <p className="suggestion-description">{outfit.description}</p>
                        <div className="suggestion-items">
                          {outfit.items.map((item, i) => (
                            <span key={i} className="suggestion-item-tag">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Style DNA Analysis */}
              <div className="dna-section">
                <h3 className="dna-title">
                  Style DNA Match
                </h3>
                <div className="dna-card">
                  <div className="dna-score">{analysis.styleDNAMatch}%</div>
                  <p className="dna-description">{analysis.styleDNAReason}</p>
                  
                  {analysis.styleKeywords && (
                    <div className="style-keywords">
                      {analysis.styleKeywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag">{keyword}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Recommendation */}
              <div className="recommendation-section">
                <div className={`recommendation-card ${
                  analysis.recommendation === 'buy' ? 'buy' :
                  analysis.recommendation === 'maybe' ? 'maybe' : 'skip'
                }`}>
                  <div className="recommendation-icon">
                    {analysis.recommendation === 'buy' ? '✅' :
                     analysis.recommendation === 'maybe' ? '🤔' : '❌'}
                  </div>
                  <h3 className="recommendation-title">
                    {analysis.recommendation === 'buy' ? 'Recommended Purchase' :
                     analysis.recommendation === 'maybe' ? 'Consider Carefully' : 'Skip This Item'}
                  </h3>
                  <p className="recommendation-reason">{analysis.recommendationReason}</p>
                  
                  {analysis.alternatives && (
                    <div className="alternatives">
                      <h4>Better Alternatives:</h4>
                      <ul>
                        {analysis.alternatives.map((alt, index) => (
                          <li key={index}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIClosetSimulator