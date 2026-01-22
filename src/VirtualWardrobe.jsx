// VirtualWardrobe.jsx - Enhanced Virtual Wardrobe with Premium Design + Upload Modal
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
  
  const [activeTab, setActiveTab] = useState('closet')
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
  
  // MODAL STATE - ONLY ADDITION
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [itemName, setItemName] = useState('')
  const [itemColor, setItemColor] = useState('')
  const [itemBrand, setItemBrand] = useState('')

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

  // MODIFIED - Opens modal instead of uploading immediately
  const handleImageUpload = async (e, category) => {
    const file = e.target.files?.[0]
    if (!file) return

    const totalItems = Object.values(wardrobe).flat().length
    if (!isPremium && totalItems >= 20) {
      alert('⭐ Free users can add up to 20 items. Upgrade to Premium for unlimited wardrobe!')
      return
    }

    // Open modal instead of uploading
    setUploadingCategory(category)
    setSelectedFile(file)
    setItemName(file.name.replace(/\.[^/.]+$/, '')) // Auto-fill name
    setItemColor('')
    setItemBrand('')
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(file)
    
    setShowUploadModal(true)
  }

  // NEW - Confirm upload from modal
  const confirmUpload = async () => {
    if (!itemName.trim()) {
      alert('Please enter an item name')
      return
    }

    setUploadingFile(selectedFile.name)

    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(selectedFile)
      })

      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: user.id,
          category: uploadingCategory,
          image_data: base64,
          name: itemName.trim(),
          color: itemColor.trim() || 'unspecified',
          brand: itemBrand.trim() || null,
          last_worn: null,
          times_worn: 0
        })
        .select()
        .single()

      if (error) throw error

      setWardrobe(prev => ({
        ...prev,
        [uploadingCategory]: [...prev[uploadingCategory], data]
      }))

      // Close modal
      setShowUploadModal(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setItemName('')
      setItemColor('')
      setItemBrand('')
      
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
          occasion: ['Casual', 'Work', 'Date Night', 'Night Out'][Math.floor(Math.random() * 4)]
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

  const getCategoryIcon = (category) => {
    const icons = {
      tops: 'T',
      bottoms: 'P',
      shoes: 'S',
      accessories: 'A',
      outerwear: 'J'
    }
    return icons[category] || 'I'
  }

  return (
    <div className="wardrobe-page">
      {/* Animated Background */}
      <div className="wardrobe-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="wardrobe-content">
        {/* Navigation Bar */}
        <nav className="wardrobe-nav">
          <button onClick={() => navigate('/rate')} className="nav-back-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          
          <div className="nav-actions">
            {!isPremium && (
              <SimpleUpgradeButton 
                text="Upgrade to Premium"
                className="nav-upgrade-btn"
              />
            )}
            <HamburgerMenu />
          </div>
        </nav>

        {/* Header Section */}
        <header className="wardrobe-header">
          <div className="header-content">
            <div className="header-badge">
              <span className="badge-dot"></span>
              {isPremium ? 'Premium Member' : 'Free Plan'}
            </div>
            <h1 className="header-title">
              Virtual Wardrobe
            </h1>
            <p className="header-subtitle">
              Upload your clothes and get AI-powered outfit combinations
            </p>

            {/* Stats */}
            <div className="wardrobe-stats">
              <div className="stat-card">
                <div className="stat-value">{getTotalItems()}</div>
                <div className="stat-label">Total Items</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-card">
                <div className="stat-value">{generatedOutfits.length}</div>
                <div className="stat-label">Outfits</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-card">
                <div className="stat-value">{isPremium ? '∞' : '20'}</div>
                <div className="stat-label">Item Limit</div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'closet' ? 'active' : ''}`}
            onClick={() => setActiveTab('closet')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2"/>
            </svg>
            My Closet
          </button>
          <button 
            className={`tab-btn ${activeTab === 'outfits' ? 'active' : ''}`}
            onClick={() => setActiveTab('outfits')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Outfits ({generatedOutfits.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            AI Suggestions
          </button>
        </div>

        {/* Main Content Area */}
        <div className="content-area">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your wardrobe...</p>
            </div>
          )}

          {/* MY CLOSET TAB */}
          {!loading && activeTab === 'closet' && (
            <div className="closet-view">
              {getTotalItems() === 0 ? (
                <div className="empty-wardrobe">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                      <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3>Your Wardrobe is Empty</h3>
                  <p>Start building your digital wardrobe by uploading your first clothing item</p>
                  <div className="empty-stats">
                    <span>Upload photos of your clothes</span>
                    <span>Get AI outfit suggestions</span>
                    <span>Never wonder what to wear again</span>
                  </div>
                </div>
              ) : (
                <>
                  {Object.keys(wardrobe).map(category => (
                    <div key={category} className="category-section">
                      <div className="category-header">
                        <div className="category-title-group">
                          <span className="category-icon">{getCategoryIcon(category)}</span>
                          <h3 className="category-title">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </h3>
                          <span className="category-count">{wardrobe[category].length} items</span>
                        </div>
                        
                        <label className="upload-label">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, category)}
                            disabled={uploadingCategory === category}
                            style={{ display: 'none' }}
                          />
                          <span className="upload-btn">
                            {uploadingCategory === category ? (
                              <>
                                <div className="button-spinner"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M12 5v14m-7-7h14" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Add Item
                              </>
                            )}
                          </span>
                        </label>
                      </div>

                      <div className="items-grid">
                        {wardrobe[category].map(item => (
                          <div key={item.id} className="item-card">
                            <div className="item-image-container">
                              <img src={item.image_data} alt={item.name} className="item-image" />
                              <button
                                className="delete-btn"
                                onClick={() => deleteItem(item.id, category)}
                                title="Remove item"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                            <div className="item-details">
                              <p className="item-name">{item.name}</p>
                              {item.times_worn > 0 && (
                                <p className="item-worn">Worn {item.times_worn}x</p>
                              )}
                            </div>
                          </div>
                        ))}

                        {wardrobe[category].length === 0 && (
                          <div className="empty-category">
                            <span className="empty-category-icon">{getCategoryIcon(category)}</span>
                            <p className="empty-category-text">No {category} yet</p>
                            <p className="empty-category-hint">Click "Add Item" to upload</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {getTotalItems() >= 3 && (
                    <div className="generate-section">
                      <button
                        className="btn-generate"
                        onClick={generateOutfits}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                          <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Generate AI Outfit Combinations
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* OUTFITS TAB - EXACT SAME AS YOUR VERSION */}
          {activeTab === 'outfits' && (
            <div className="outfits-view">
              {generatedOutfits.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3>No Outfits Yet</h3>
                  <p>Generate AI-powered outfit combinations from your wardrobe</p>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('closet')}
                  >
                    Go to My Closet
                  </button>
                </div>
              ) : (
                <>
                  <div className="outfits-header">
                    <div>
                      <h2 className="outfits-title">AI-Generated Combinations</h2>
                      <p className="outfits-subtitle">Perfectly matched outfits from your wardrobe</p>
                    </div>
                    <button className="btn-refresh" onClick={generateOutfits}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Regenerate
                    </button>
                  </div>

                  <div className="outfits-grid">
                    {generatedOutfits.map((outfit, index) => (
                      <div key={outfit.id} className="outfit-card">
                        <div className="outfit-header">
                          <span className="outfit-number">#{index + 1}</span>
                          <span className="outfit-occasion">{outfit.occasion}</span>
                        </div>
                        
                        <div className="outfit-items">
                          {outfit.top && (
                            <div className="outfit-item">
                              <img src={outfit.top.image_data} alt="Top" />
                              <span className="outfit-item-label">Top</span>
                            </div>
                          )}
                          {outfit.bottom && (
                            <div className="outfit-item">
                              <img src={outfit.bottom.image_data} alt="Bottom" />
                              <span className="outfit-item-label">Bottom</span>
                            </div>
                          )}
                          {outfit.shoes && (
                            <div className="outfit-item">
                              <img src={outfit.shoes.image_data} alt="Shoes" />
                              <span className="outfit-item-label">Shoes</span>
                            </div>
                          )}
                          {outfit.outerwear && (
                            <div className="outfit-item">
                              <img src={outfit.outerwear.image_data} alt="Outerwear" />
                              <span className="outfit-item-label">Outerwear</span>
                            </div>
                          )}
                          {outfit.accessory && (
                            <div className="outfit-item">
                              <img src={outfit.accessory.image_data} alt="Accessory" />
                              <span className="outfit-item-label">Accessory</span>
                            </div>
                          )}
                        </div>

                        <button className="btn-rate-outfit" onClick={() => navigate('/rate')}>
                          Rate This Outfit
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path d="M4 10h12m0 0l-4-4m4 4l-4 4" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* AI SUGGESTIONS TAB - EXACT SAME AS YOUR VERSION */}
          {activeTab === 'suggestions' && (
            <div className="suggestions-view">
              <div className="suggestions-header">
                <h2 className="suggestions-title">AI Shopping Suggestions</h2>
                <p className="suggestions-subtitle">Complete your wardrobe with these recommendations</p>
              </div>

              <div className="suggestions-grid">
                <div className="suggestion-card">
                  <div className="suggestion-header">
                    <span className="suggestion-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2"/>
                        <path d="M2 12l10 5 10-5M2 17l10 5 10-5" strokeWidth="2"/>
                      </svg>
                    </span>
                    <h3>Missing Basics</h3>
                  </div>
                  <p>You could use more neutral-colored tops. Consider adding:</p>
                  <ul className="suggestion-list">
                    <li>White button-down shirt</li>
                    <li>Black t-shirt</li>
                    <li>Navy sweater</li>
                  </ul>
                  <span className="priority-badge high">High Priority</span>
                </div>

                <div className="suggestion-card">
                  <div className="suggestion-header">
                    <span className="suggestion-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M4 8l8-4 8 4" strokeWidth="2"/>
                        <path d="M4 12l8 4 8-4M4 16l8 4 8-4" strokeWidth="2"/>
                      </svg>
                    </span>
                    <h3>Shoe Gap</h3>
                  </div>
                  <p>Expand your footwear options with:</p>
                  <ul className="suggestion-list">
                    <li>Casual white sneakers</li>
                    <li>Dress shoes for formal events</li>
                  </ul>
                  <span className="priority-badge medium">Medium Priority</span>
                </div>

                <div className="suggestion-card">
                  <div className="suggestion-header">
                    <span className="suggestion-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2a4 4 0 00-4 4v4H4v12h16V10h-4V6a4 4 0 00-4-4z" strokeWidth="2"/>
                        <path d="M8 10v3m8-3v3" strokeWidth="2"/>
                      </svg>
                    </span>
                    <h3>Weather Protection</h3>
                  </div>
                  <p>Don't forget seasonal essentials:</p>
                  <ul className="suggestion-list">
                    <li>Light rain jacket</li>
                    <li>Winter coat</li>
                  </ul>
                  <span className="priority-badge low">Low Priority</span>
                </div>

                <div className="suggestion-card premium-card">
                  <div className="premium-overlay">
                    <svg className="lock-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="suggestion-header">
                    <span className="suggestion-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                        <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <h3>Premium AI Analysis</h3>
                  </div>
                  <p>Unlock advanced AI wardrobe analysis:</p>
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

      {/* UPLOAD MODAL - ONLY NEW ADDITION */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Add {uploadingCategory?.charAt(0).toUpperCase() + uploadingCategory?.slice(1)}</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="upload-modal-content">
              {previewUrl && (
                <div className="upload-preview-container">
                  <img src={previewUrl} alt="Preview" className="upload-preview-image" />
                </div>
              )}

              <div className="upload-form">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g., Blue Denim Jeans"
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="text"
                      value={itemColor}
                      onChange={(e) => setItemColor(e.target.value)}
                      placeholder="e.g., Blue"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Brand</label>
                    <input
                      type="text"
                      value={itemBrand}
                      onChange={(e) => setItemBrand(e.target.value)}
                      placeholder="e.g., Levi's"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="upload-modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadingFile}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={confirmUpload}
                  disabled={!itemName.trim() || uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <div className="button-spinner"></div>
                      Uploading...
                    </>
                  ) : (
                    'Add to Wardrobe'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VirtualWardrobe