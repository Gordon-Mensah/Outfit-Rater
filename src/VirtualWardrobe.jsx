// VirtualWardrobe.jsx - Virtual Wardrobe with AI Outfit Suggestions
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import SimpleUpgradeButton from './SimpleUpgradeButton'
import './VirtualWardrobe.css'

function VirtualWardrobe() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('closet') // 'closet', 'outfits', 'suggestions'
  const [wardrobe, setWardrobe] = useState({
    tops: [],
    bottoms: [],
    shoes: [],
    accessories: [],
    outerwear: []
  })
  const [loading, setLoading] = useState(true)
  const [generatedOutfits, setGeneratedOutfits] = useState([])
  const [uploadingCategory, setUploadingCategory] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(null)

  useEffect(() => {
    if (user) {
      loadWardrobe()
    }
  }, [user])

  const loadWardrobe = async () => {
    if (!user) return
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Organize by category
      const organized = {
        tops: [],
        bottoms: [],
        shoes: [],
        accessories: [],
        outerwear: []
      }
      
      data?.forEach(item => {
        if (organized[item.category]) {
          organized[item.category].push(item)
        }
      })
      
      setWardrobe(organized)
    } catch (err) {
      console.error('Error loading wardrobe:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e, category) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check premium limits
    const totalItems = Object.values(wardrobe).flat().length
    if (!isPremium && totalItems >= 20) {
      alert('⭐ Free users can add up to 20 items. Upgrade to Premium for unlimited wardrobe!')
      return
    }

    setUploadingCategory(category)
    setUploadingFile(file.name)

    try {
      // Convert to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })

      // Save to database
      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: user.id,
          category: category,
          image_data: base64,
          name: file.name,
          color: 'unspecified', // Could add color detection
          last_worn: null,
          times_worn: 0
        })
        .select()
        .single()

      if (error) throw error

      // Update local state
      setWardrobe(prev => ({
        ...prev,
        [category]: [...prev[category], data]
      }))

      alert('✅ Item added to your wardrobe!')
    } catch (err) {
      console.error('Error uploading:', err)
      alert('Failed to add item. Please try again.')
    } finally {
      setUploadingCategory(null)
      setUploadingFile(null)
    }
  }

  const deleteItem = async (itemId, category) => {
    if (!confirm('Remove this item from your wardrobe?')) return

    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (error) throw error

      setWardrobe(prev => ({
        ...prev,
        [category]: prev[category].filter(item => item.id !== itemId)
      }))
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Failed to delete item')
    }
  }

  const generateOutfits = async () => {
    const totalItems = Object.values(wardrobe).flat().length
    
    if (totalItems < 3) {
      alert('Add at least 3 items to your wardrobe to generate outfits!')
      return
    }

    setLoading(true)
    setActiveTab('outfits')

    try {
      // Generate random combinations (simplified - real AI would be better)
      const outfits = []
      const { tops, bottoms, shoes, outerwear, accessories } = wardrobe

      for (let i = 0; i < Math.min(5, tops.length); i++) {
        const outfit = {
          id: `outfit-${i}`,
          top: tops[i] || tops[0],
          bottom: bottoms[Math.floor(Math.random() * bottoms.length)],
          shoes: shoes[Math.floor(Math.random() * shoes.length)],
          outerwear: outerwear.length > 0 ? outerwear[Math.floor(Math.random() * outerwear.length)] : null,
          accessory: accessories.length > 0 ? accessories[Math.floor(Math.random() * accessories.length)] : null,
          occasion: ['casual', 'work', 'date', 'night out'][Math.floor(Math.random() * 4)]
        }
        outfits.push(outfit)
      }

      setGeneratedOutfits(outfits)
    } catch (err) {
      console.error('Error generating outfits:', err)
      alert('Failed to generate outfits')
    } finally {
      setLoading(false)
    }
  }

  const getTotalItems = () => {
    return Object.values(wardrobe).flat().length
  }

  return (
    <div className="wardrobe-page">
      {/* Animated Background */}
      <div className="landing-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="wardrobe-content">
        {/* Header */}
        <div className="wardrobe-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="header">
            <div className="header-text">
              <h1 className="page-title">
                👔 Virtual Wardrobe
                <span className="premium-indicator">{isPremium ? '⭐ Premium' : '🆓 Free'}</span>
              </h1>
              <p className="page-subtitle">
                Upload your clothes and get AI-powered outfit combinations
              </p>
            </div>
            <HamburgerMenu />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="wardrobe-stats-bar">
          <div className="stat-box">
            <div className="stat-number">{getTotalItems()}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{wardrobe.tops.length}</div>
            <div className="stat-label">Tops</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{wardrobe.bottoms.length}</div>
            <div className="stat-label">Bottoms</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{wardrobe.shoes.length}</div>
            <div className="stat-label">Shoes</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{generatedOutfits.length}</div>
            <div className="stat-label">Outfits</div>
          </div>
        </div>

        {/* Storage Limit Warning */}
        {!isPremium && getTotalItems() >= 15 && (
          <div className="limit-warning-banner">
            <span className="warning-icon">⚠️</span>
            <div className="warning-text">
              <strong>Storage Limit Warning:</strong> You're using {getTotalItems()}/20 free items.
              <SimpleUpgradeButton 
                text="Upgrade for Unlimited Storage"
                className="inline-upgrade-btn"
              />
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="wardrobe-tabs">
          <button
            className={`tab-btn ${activeTab === 'closet' ? 'active' : ''}`}
            onClick={() => setActiveTab('closet')}
          >
            <span className="tab-icon">👕</span>
            <span>My Closet</span>
            <span className="tab-count">{getTotalItems()}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'outfits' ? 'active' : ''}`}
            onClick={() => setActiveTab('outfits')}
          >
            <span className="tab-icon">✨</span>
            <span>Generated Outfits</span>
            <span className="tab-count">{generatedOutfits.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <span className="tab-icon">💡</span>
            <span>AI Suggestions</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="wardrobe-tab-content">
          {/* MY CLOSET TAB */}
          {activeTab === 'closet' && (
            <div className="closet-view">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading your wardrobe...</p>
                </div>
              ) : (
                <>
                  {['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'].map(category => (
                    <div key={category} className="category-section">
                      <div className="category-header">
                        <h3 className="category-title">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                          <span className="item-count">({wardrobe[category].length})</span>
                        </h3>
                        
                        <label className="upload-btn">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, category)}
                            disabled={uploadingCategory === category}
                            style={{ display: 'none' }}
                          />
                          {uploadingCategory === category ? (
                            <span>📤 Uploading...</span>
                          ) : (
                            <span>➕ Add Item</span>
                          )}
                        </label>
                      </div>

                      <div className="items-grid">
                        {wardrobe[category].map(item => (
                          <div key={item.id} className="wardrobe-item-card">
                            <div className="item-image-wrapper">
                              <img src={item.image_data} alt={item.name} />
                              <button
                                className="delete-item-btn"
                                onClick={() => deleteItem(item.id, category)}
                              >
                                🗑️
                              </button>
                            </div>
                            <div className="item-info">
                              <p className="item-name">{item.name}</p>
                              {item.times_worn > 0 && (
                                <p className="item-worn">Worn {item.times_worn}x</p>
                              )}
                            </div>
                          </div>
                        ))}

                        {wardrobe[category].length === 0 && (
                          <div className="empty-category">
                            <p className="empty-icon">📦</p>
                            <p className="empty-text">No {category} yet</p>
                            <p className="empty-hint">Upload your first item to get started</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {getTotalItems() >= 3 && (
                    <div className="generate-section">
                      <button
                        className="btn-generate-outfits"
                        onClick={generateOutfits}
                      >
                        ✨ Generate Outfit Combinations
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* GENERATED OUTFITS TAB */}
          {activeTab === 'outfits' && (
            <div className="outfits-view">
              {generatedOutfits.length === 0 ? (
                <div className="empty-outfits">
                  <div className="empty-icon">✨</div>
                  <h3>No Outfits Generated Yet</h3>
                  <p>Add at least 3 items to your wardrobe and click "Generate Outfit Combinations"</p>
                  <button
                    className="btn-go-to-closet"
                    onClick={() => setActiveTab('closet')}
                  >
                    Go to My Closet
                  </button>
                </div>
              ) : (
                <>
                  <div className="outfits-header">
                    <h2>AI-Generated Outfit Combinations</h2>
                    <button className="btn-refresh-outfits" onClick={generateOutfits}>
                      🔄 Generate New Outfits
                    </button>
                  </div>

                  <div className="outfits-grid">
                    {generatedOutfits.map((outfit, index) => (
                      <div key={outfit.id} className="outfit-combo-card">
                        <div className="outfit-number">Outfit #{index + 1}</div>
                        <div className="outfit-occasion-badge">{outfit.occasion}</div>
                        
                        <div className="outfit-items">
                          {outfit.top && (
                            <div className="outfit-item">
                              <img src={outfit.top.image_data} alt="Top" />
                              <span className="item-label">Top</span>
                            </div>
                          )}
                          {outfit.bottom && (
                            <div className="outfit-item">
                              <img src={outfit.bottom.image_data} alt="Bottom" />
                              <span className="item-label">Bottom</span>
                            </div>
                          )}
                          {outfit.shoes && (
                            <div className="outfit-item">
                              <img src={outfit.shoes.image_data} alt="Shoes" />
                              <span className="item-label">Shoes</span>
                            </div>
                          )}
                          {outfit.outerwear && (
                            <div className="outfit-item">
                              <img src={outfit.outerwear.image_data} alt="Outerwear" />
                              <span className="item-label">Outerwear</span>
                            </div>
                          )}
                          {outfit.accessory && (
                            <div className="outfit-item">
                              <img src={outfit.accessory.image_data} alt="Accessory" />
                              <span className="item-label">Accessory</span>
                            </div>
                          )}
                        </div>

                        <button className="btn-rate-outfit">
                          Rate This Outfit →
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* AI SUGGESTIONS TAB */}
          {activeTab === 'suggestions' && (
            <div className="suggestions-view">
              <div className="suggestions-header">
                <h2>🤖 AI Shopping Suggestions</h2>
                <p>Based on your current wardrobe, here's what might complete your style</p>
              </div>

              <div className="suggestions-grid">
                <div className="suggestion-card">
                  <div className="suggestion-icon">👕</div>
                  <h3>Missing Basics</h3>
                  <p>You could use more neutral-colored tops. Consider adding:</p>
                  <ul className="suggestion-list">
                    <li>White button-down shirt</li>
                    <li>Black t-shirt</li>
                    <li>Navy sweater</li>
                  </ul>
                  <span className="suggestion-priority high">High Priority</span>
                </div>

                <div className="suggestion-card">
                  <div className="suggestion-icon">👞</div>
                  <h3>Shoe Gap</h3>
                  <p>Expand your footwear options with:</p>
                  <ul className="suggestion-list">
                    <li>Casual white sneakers</li>
                    <li>Dress shoes for formal events</li>
                  </ul>
                  <span className="suggestion-priority medium">Medium Priority</span>
                </div>

                <div className="suggestion-card">
                  <div className="suggestion-icon">🧥</div>
                  <h3>Weather Protection</h3>
                  <p>Don't forget seasonal essentials:</p>
                  <ul className="suggestion-list">
                    <li>Light rain jacket</li>
                    <li>Winter coat</li>
                  </ul>
                  <span className="suggestion-priority low">Low Priority</span>
                </div>

                <div className="suggestion-card premium-suggestion">
                  <div className="lock-icon">🔒</div>
                  <h3>Premium AI Analysis</h3>
                  <p>Unlock advanced AI wardrobe analysis including:</p>
                  <ul className="suggestion-list">
                    <li>Color palette analysis</li>
                    <li>Style consistency scoring</li>
                    <li>Seasonal wardrobe planning</li>
                    <li>Budget shopping recommendations</li>
                  </ul>
                  {!isPremium && (
                    <SimpleUpgradeButton 
                      text="Upgrade to Premium"
                      className="suggestion-upgrade-btn"
                    />
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

export default VirtualWardrobe