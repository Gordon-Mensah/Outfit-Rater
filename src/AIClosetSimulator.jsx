// AIClosetSimulator.jsx - With image-based wardrobe matching
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
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleImageUpload = (file) => {
    if (!file) return
    setProductImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setProductPreview(reader.result)
    reader.readAsDataURL(file)
    setError(null)
    setResult(null)
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
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to analyze product')
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setProductImage(null)
    setProductPreview(null)
    setResult(null)
    setError(null)
    setProductTitle('')
  }

  const s = result?.structured

  const verdictColor = s?.verdict === 'Buy'
    ? '#4ade80'
    : s?.verdict === 'Maybe'
    ? '#facc15'
    : '#f87171'

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
            Drop any item. See exactly how it fits into your wardrobe.
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
                Get AI-powered wardrobe analysis with visual item matching, outfit combinations, and purchase intelligence.
              </p>
              <ul className="sim-gate-list">
                <li>Visual wardrobe item matching</li>
                <li>Outfit combinations with your actual clothes</li>
                <li>Color palette analysis</li>
                <li>Predicted wear frequency</li>
                <li>Buy / Skip recommendation</li>
              </ul>
              <div className="sim-gate-actions">
                <SimpleUpgradeButton text="Unlock Premium" />
                <button className="sim-gate-back" onClick={() => navigate('/rate')}>Go back</button>
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <div className={`sim-main ${!isPremium ? 'sim-blur' : ''}`}>
          {!result ? (
            <div className="sim-layout">

              {/* Upload col */}
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
                      <label htmlFor="sim-upload" className="sim-filled-change">Change image</label>
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
                    <><span className="sim-spin"></span>Analyzing...</>
                  ) : (
                    'Analyze Item'
                  )}
                </button>
              </div>

              {/* Info col */}
              <div className="sim-col-info">
                <div className="sim-col-label">What you get</div>
                <div className="sim-info-items">
                  {[
                    { n: '01', title: 'Visual Matches', desc: 'See exactly which items from your wardrobe pair with this piece.' },
                    { n: '02', title: 'Outfit Combinations', desc: 'Full outfit suggestions built from your actual clothes.' },
                    { n: '03', title: 'Wear Prediction', desc: 'How often you will actually reach for it.' },
                    { n: '04', title: 'Color Analysis', desc: 'How it affects your wardrobe palette.' },
                    { n: '05', title: 'Buy or Skip', desc: 'A clear verdict with a reason.' },
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
                  <h2 className="sim-results-title">{productTitle || 'Your item'}</h2>
                </div>
                <button className="sim-btn-ghost" onClick={reset}>Try another</button>
              </div>

              {s ? (
                <>
                  {/* Top row — image + score + verdict */}
                  <div className="sim-top-row">
                    <div className="sim-top-image">
                      {productPreview && (
                        <img src={productPreview} alt="Item" className="sim-res-img" />
                      )}
                    </div>

                    <div className="sim-top-info">
                      {s.itemType && (
                        <p className="sim-item-type">{s.itemType}</p>
                      )}

                      <div className="sim-score-row">
                        <div className="sim-score-block">
                          <span className="sim-score-num" style={{ color: '#e8e4dc' }}>
                            {s.wardrobeFitScore}
                          </span>
                          <span className="sim-score-denom">/10</span>
                        </div>
                        <span className="sim-score-lbl">Wardrobe fit</span>
                      </div>

                      {s.verdict && (
                        <div className="sim-verdict-pill" style={{ borderColor: verdictColor, color: verdictColor }}>
                          {s.verdict}
                        </div>
                      )}
                      {s.verdictReason && (
                        <p className="sim-verdict-reason">{s.verdictReason}</p>
                      )}

                      {s.strengths?.length > 0 && (
                        <div className="sim-quick-facts">
                          {s.strengths.map((str, i) => (
                            <span key={i} className="sim-fact sim-fact-good">{str}</span>
                          ))}
                          {s.concerns?.map((con, i) => (
                            <span key={i} className="sim-fact sim-fact-warn">{con}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Wardrobe Matches — IMAGE CARDS */}
                  {s.wardrobeMatches?.length > 0 && (
                    <div className="sim-section">
                      <div className="sim-section-hd">
                        <span className="sim-col-label">Wardrobe matches</span>
                        <span className="sim-section-count">{s.wardrobeMatches.length} items</span>
                      </div>
                      <div className="sim-match-grid">
                        {s.wardrobeMatches.map((match, i) => (
                          <div key={i} className="sim-match-card">
                            <div className="sim-match-img-wrap">
                              {match.image_data ? (
                                <img
                                  src={match.image_data}
                                  alt={match.itemName}
                                  className="sim-match-img"
                                />
                              ) : (
                                <div className="sim-match-img-placeholder">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                    <path d="M21 15l-5-5L5 21" strokeWidth="1.5"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="sim-match-info">
                              <div className="sim-match-name">{match.itemName}</div>
                              {match.color && match.color !== 'unspecified' && (
                                <div className="sim-match-color">{match.color}</div>
                              )}
                              <p className="sim-match-reason">{match.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No wardrobe message */}
                  {(!s.wardrobeMatches || s.wardrobeMatches.length === 0) && (
                    <div className="sim-section">
                      <div className="sim-section-hd">
                        <span className="sim-col-label">Wardrobe matches</span>
                      </div>
                      <div className="sim-empty-wardrobe">
                        <p>Your wardrobe is empty. Add items to your virtual wardrobe to see how this piece matches your existing clothes.</p>
                        <button className="sim-btn-ghost" onClick={() => navigate('/wardrobe')}>
                          Go to wardrobe
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Outfit Ideas — IMAGE STRIPS */}
                  {s.outfitIdeas?.length > 0 && (
                    <div className="sim-section">
                      <div className="sim-section-hd">
                        <span className="sim-col-label">Outfit combinations</span>
                      </div>
                      <div className="sim-outfits">
                        {s.outfitIdeas.map((outfit, i) => (
                          <div key={i} className="sim-outfit">
                            <div className="sim-outfit-meta">
                              <span className="sim-outfit-n">0{i + 1}</span>
                              <span className="sim-outfit-occasion">{outfit.occasion}</span>
                            </div>

                            {/* New item + wardrobe items as image strip */}
                            <div className="sim-outfit-strip">
                              {/* The item being analyzed always first */}
                              <div className="sim-strip-item sim-strip-item-new">
                                <img src={productPreview} alt="New item" className="sim-strip-img" />
                                <span className="sim-strip-label">New</span>
                              </div>

                              {outfit.items?.map((item, j) => (
                                <div key={j} className="sim-strip-item">
                                  {item.image_data ? (
                                    <img src={item.image_data} alt={item.name} className="sim-strip-img" />
                                  ) : (
                                    <div className="sim-strip-placeholder">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                                        <path d="M21 15l-5-5L5 21" strokeWidth="1.5"/>
                                      </svg>
                                    </div>
                                  )}
                                  <span className="sim-strip-label">{item.name}</span>
                                </div>
                              ))}
                            </div>

                            <p className="sim-outfit-desc">{outfit.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Fallback: raw text if JSON parsing failed */
                <div className="sim-section">
                  <div className="sim-res-metric">
                    <p className="sim-res-metric-desc sim-raw-analysis">{result.analysis}</p>
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