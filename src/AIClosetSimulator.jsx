// AIClosetSimulator.jsx - Redesigned
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
  const [productTitle, setProductTitle] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleImageUpload = (file) => {
    if (!file) return
    setProductImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setProductPreview(reader.result)
    reader.readAsDataURL(file)
    setError(null)
    setAnalysis(null)
  }

  const handleFileInput = (e) => handleImageUpload(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleImageUpload(e.dataTransfer.files?.[0])
  }

  const analyzeProduct = async () => {
    if (!productImage) { setError('Please upload a product image first'); return }
    if (!isPremium) { setError('AI Closet Simulator is a Premium feature'); return }

    setAnalyzing(true)
    setError(null)

    try {
      const { data: wardrobeData } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)

      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(productImage)
      })

      const response = await fetch(`${API_BASE_URL}/api/analyze-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImage: base64Image,
          title: productTitle || 'Unknown product',
          wardrobeItems: wardrobeData || [],
          userId: user.id
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data)
    } catch (err) {
      setError(err.message || 'Failed to analyze product')
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setProductImage(null)
    setProductPreview(null)
    setAnalysis(null)
    setError(null)
    setProductTitle('')
  }

  return (
    <div className="sim-page">
      <div className="sim-bg">
        <div className="sim-grain"></div>
        <div className="sim-orb-1"></div>
        <div className="sim-orb-2"></div>
        <div className="sim-lines"></div>
      </div>

      <div className="sim-wrap">

        {/* Nav */}
        <nav className="sim-nav">
          <button className="sim-back" onClick={() => navigate('/rate')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </button>
          <div className="sim-nav-r">
            {!isPremium && <SimpleUpgradeButton text="Upgrade" />}
            <HamburgerMenu />
          </div>
        </nav>

        {/* Header */}
        <header className="sim-header">
          <div className="sim-header-meta">
            <span className="sim-header-index">001</span>
            <span className="sim-header-sep">—</span>
            <span className={`sim-status ${isPremium ? 'sim-status-on' : 'sim-status-off'}`}>
              <span className="sim-status-dot"></span>
              {isPremium ? 'Active' : 'Locked'}
            </span>
          </div>
          <h1 className="sim-h1">
            <span className="sim-h1-line">AI Closet</span>
            <span className="sim-h1-line sim-h1-accent">Simulator</span>
          </h1>
          <p className="sim-lead">
            Drop any item. Know instantly if it belongs in your wardrobe.
          </p>
        </header>

        {/* Premium Gate */}
        {!isPremium && (
          <div className="sim-gate">
            <div className="sim-gate-card">
              <div className="sim-gate-lock">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 className="sim-gate-title">Premium Feature</h2>
              <p className="sim-gate-desc">
                Get AI-powered wardrobe analysis, outfit compatibility, and purchase intelligence.
              </p>
              <ul className="sim-gate-list">
                <li>Wardrobe compatibility scoring</li>
                <li>Outfit creation potential</li>
                <li>Color palette analysis</li>
                <li>Predicted wear frequency</li>
                <li>Buy / Skip recommendation</li>
                <li>Style DNA matching</li>
              </ul>
              <div className="sim-gate-actions">
                <SimpleUpgradeButton text="Unlock Premium" />
                <button className="sim-gate-back" onClick={() => navigate('/rate')}>
                  Go back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className={`sim-main ${!isPremium ? 'sim-blur' : ''}`}>
          {!analysis ? (
            <div className="sim-layout">

              {/* Left — Upload */}
              <div className="sim-col-upload">
                <div className="sim-col-label">Upload</div>

                <div
                  className={`sim-drop ${dragOver ? 'sim-drop-over' : ''} ${productPreview ? 'sim-drop-filled' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    id="sim-upload"
                    style={{ display: 'none' }}
                    disabled={!isPremium}
                  />
                  {productPreview ? (
                    <div className="sim-filled">
                      <img src={productPreview} alt="Product" className="sim-filled-img" />
                      <label htmlFor="sim-upload" className="sim-filled-change">
                        Change image
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="sim-upload" className="sim-drop-idle">
                      <div className="sim-drop-svg">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                          <rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
                          <path d="M24 32V16M17 23l7-7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="sim-drop-label">Drag & drop or click to upload</p>
                      <p className="sim-drop-sub">PNG or JPG, up to 10MB</p>
                    </label>
                  )}
                </div>

                <div className="sim-field-group">
                  <label className="sim-label">
                    Item name
                    <span className="sim-optional">optional</span>
                  </label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={e => setProductTitle(e.target.value)}
                    placeholder="e.g. Cream linen blazer"
                    className="sim-input"
                    disabled={!isPremium}
                  />
                </div>

                {error && (
                  <div className="sim-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  className="sim-btn-primary"
                  onClick={analyzeProduct}
                  disabled={!productImage || analyzing || !isPremium}
                >
                  {analyzing ? (
                    <>
                      <span className="sim-spin"></span>
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Item'
                  )}
                </button>
              </div>

              {/* Right — What you get */}
              <div className="sim-col-info">
                <div className="sim-col-label">What you get</div>
                <div className="sim-info-items">
                  {[
                    { n: '01', title: 'Wardrobe Fit', desc: 'See how this item works with everything you already own.' },
                    { n: '02', title: 'Outfit Potential', desc: 'Discover exactly how many new combinations it unlocks.' },
                    { n: '03', title: 'Wear Prediction', desc: 'AI estimates how often you\'ll actually reach for it.' },
                    { n: '04', title: 'Color Analysis', desc: 'Understand the palette impact on your wardrobe.' },
                    { n: '05', title: 'Buy or Skip', desc: 'A clear verdict — no second guessing.' },
                  ].map(({ n, title, desc }) => (
                    <div key={n} className="sim-info-row">
                      <span className="sim-info-n">{n}</span>
                      <div className="sim-info-body">
                        <div className="sim-info-title">{title}</div>
                        <div className="sim-info-desc">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Results ── */
            <div className="sim-results">
              <div className="sim-results-header">
                <div>
                  <div className="sim-col-label">Analysis complete</div>
                  <h2 className="sim-results-title">
                    {productTitle || 'Your item'}
                  </h2>
                </div>
                <button className="sim-btn-ghost" onClick={reset}>
                  Try another
                </button>
              </div>

              <div className="sim-results-body">

                {/* Left — image + score */}
                <div className="sim-res-left">
                  {productPreview && (
                    <div className="sim-res-img-wrap">
                      <img src={productPreview} alt="Item" className="sim-res-img" />
                    </div>
                  )}

                  {analysis.overallScore !== undefined && (
                    <div className="sim-score">
                      <div
                        className="sim-score-circle"
                        style={{
                          '--c': analysis.overallScore >= 80 ? '#4ade80'
                               : analysis.overallScore >= 60 ? '#facc15' : '#f87171'
                        }}
                      >
                        <span className="sim-score-n">{analysis.overallScore}</span>
                        <span className="sim-score-100">/100</span>
                      </div>
                      <span className="sim-score-lbl">Match Score</span>
                    </div>
                  )}

                  {(analysis.verdict || analysis.verdictReason) && (
                    <div className="sim-verdict">
                      {analysis.verdict && <div className="sim-verdict-title">{analysis.verdict}</div>}
                      {analysis.verdictReason && <p className="sim-verdict-body">{analysis.verdictReason}</p>}
                    </div>
                  )}
                </div>

                {/* Right — metrics */}
                <div className="sim-res-right">

                  {analysis.wardrobeCompatibility !== undefined && (
                    <div className="sim-res-metric">
                      <div className="sim-res-metric-head">
                        <span className="sim-res-metric-lbl">Wardrobe Compatibility</span>
                        <span className="sim-res-metric-val">{analysis.wardrobeCompatibility}%</span>
                      </div>
                      <div className="sim-bar">
                        <div className="sim-bar-fill" style={{
                          width: `${analysis.wardrobeCompatibility}%`,
                          background: analysis.wardrobeCompatibility >= 70 ? '#4ade80' : '#facc15'
                        }}></div>
                      </div>
                      {analysis.compatibilityReason && (
                        <p className="sim-res-metric-desc">{analysis.compatibilityReason}</p>
                      )}
                    </div>
                  )}

                  {analysis.newOutfitsCount !== undefined && (
                    <div className="sim-res-metric">
                      <div className="sim-res-metric-head">
                        <span className="sim-res-metric-lbl">New Outfits Unlocked</span>
                        <span className="sim-res-metric-val">{analysis.newOutfitsCount}</span>
                      </div>
                      <p className="sim-res-metric-desc">
                        {analysis.newOutfitsCount} new combinations added to your wardrobe
                      </p>
                    </div>
                  )}

                  {analysis.predictedWears !== undefined && (
                    <div className="sim-res-metric">
                      <div className="sim-res-metric-head">
                        <span className="sim-res-metric-lbl">Predicted Monthly Wears</span>
                        <span className="sim-res-metric-val">{analysis.predictedWears}×</span>
                      </div>
                      {analysis.wearFrequencyReason && (
                        <p className="sim-res-metric-desc">{analysis.wearFrequencyReason}</p>
                      )}
                    </div>
                  )}

                  {analysis.colorImpact && (
                    <div className="sim-res-metric">
                      <div className="sim-res-metric-head">
                        <span className="sim-res-metric-lbl">Color Palette Impact</span>
                        <span className="sim-res-metric-val">{analysis.colorImpact}</span>
                      </div>
                      {analysis.colorImpactReason && (
                        <p className="sim-res-metric-desc">{analysis.colorImpactReason}</p>
                      )}
                    </div>
                  )}

                  {/* Fallback: raw analysis text */}
                  {analysis.analysis && !analysis.overallScore && (
                    <div className="sim-res-metric">
                      <div className="sim-res-metric-head">
                        <span className="sim-res-metric-lbl">AI Analysis</span>
                      </div>
                      <p className="sim-res-metric-desc sim-raw-analysis">{analysis.analysis}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Outfit Suggestions */}
              {analysis.outfitSuggestions?.length > 0 && (
                <div className="sim-section">
                  <div className="sim-section-hd">
                    <span className="sim-col-label">Outfit Combinations</span>
                  </div>
                  <div className="sim-outfits">
                    {analysis.outfitSuggestions.map((outfit, i) => (
                      <div key={i} className="sim-outfit">
                        <div className="sim-outfit-n">0{i + 1}</div>
                        <div className="sim-outfit-occasion">{outfit.occasion}</div>
                        <p className="sim-outfit-desc">{outfit.description}</p>
                        {outfit.items && (
                          <div className="sim-tags">
                            {outfit.items.map((item, j) => (
                              <span key={j} className="sim-tag">{item}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Style DNA */}
              {analysis.styleDNAMatch !== undefined && (
                <div className="sim-section">
                  <div className="sim-section-hd">
                    <span className="sim-col-label">Style DNA Match</span>
                  </div>
                  <div className="sim-dna">
                    <div className="sim-dna-score">{analysis.styleDNAMatch}%</div>
                    <div className="sim-dna-right">
                      {analysis.styleDNAReason && (
                        <p className="sim-dna-desc">{analysis.styleDNAReason}</p>
                      )}
                      {analysis.styleKeywords && (
                        <div className="sim-tags">
                          {analysis.styleKeywords.map((kw, i) => (
                            <span key={i} className="sim-tag">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {analysis.recommendation && (
                <div className="sim-section">
                  <div className="sim-section-hd">
                    <span className="sim-col-label">Verdict</span>
                  </div>
                  <div className={`sim-rec sim-rec-${analysis.recommendation}`}>
                    <div className="sim-rec-pill">
                      {analysis.recommendation === 'buy' && 'Buy It'}
                      {analysis.recommendation === 'maybe' && 'Think Twice'}
                      {analysis.recommendation === 'skip' && 'Skip It'}
                    </div>
                    <div className="sim-rec-body">
                      {analysis.recommendationReason && (
                        <p className="sim-rec-reason">{analysis.recommendationReason}</p>
                      )}
                      {analysis.alternatives?.length > 0 && (
                        <div className="sim-alts">
                          <div className="sim-alts-lbl">Consider instead:</div>
                          <ul className="sim-alts-list">
                            {analysis.alternatives.map((alt, i) => (
                              <li key={i}>{alt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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

export default AIClosetSimulator