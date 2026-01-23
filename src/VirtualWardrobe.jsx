// VirtualWardrobe.jsx - Enhanced with Quick Upload & Auto Location Weather
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
  
  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [itemName, setItemName] = useState('')
  const [itemColor, setItemColor] = useState('')
  const [itemBrand, setItemBrand] = useState('')

  // Weather State
  const [weather, setWeather] = useState(null)
  const [locationPermission, setLocationPermission] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(false)

  useEffect(() => {
    if (user) {
      loadWardrobe()
      requestLocationAndWeather()
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

  const requestLocationAndWeather = async () => {
    setLoadingWeather(true)
    
    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      setLoadingWeather(false)
      return
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      setLocationPermission('granted')
      
      const { latitude, longitude } = position.coords
      
      // Fetch weather from OpenWeatherMap API
      const API_KEY = 'YOUR_API_KEY' // You'll need to add your API key
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const weatherIcons = {
          'Clear': '☀️',
          'Clouds': '☁️',
          'Rain': '🌧️',
          'Drizzle': '🌦️',
          'Thunderstorm': '⛈️',
          'Snow': '❄️',
          'Mist': '🌫️',
          'Fog': '🌫️'
        }
        
        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: weatherIcons[data.weather[0].main] || '🌤️'
        })
      } else {
        // Fallback to demo weather
        setWeather({
          temp: 22,
          condition: 'Clear',
          icon: '☀️'
        })
      }
    } catch (error) {
      setLocationPermission('denied')
      console.log('Location permission denied or error:', error)
      // Show demo weather
      setWeather({
        temp: 22,
        condition: 'Clear',
        icon: '☀️'
      })
    } finally {
      setLoadingWeather(false)
    }
  }

  const handleQuickUpload = () => {
    // Trigger file input for quick upload from empty state
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (file) {
        // Default to 'tops' category for quick upload
        handleImageUpload({ target: { files: [file] } }, 'tops')
      }
    }
    input.click()
  }

  const handleImageUpload = async (e, category) => {
    const file = e.target.files?.[0]
    if (!file) return

    const totalItems = Object.values(wardrobe).flat().length
    if (!isPremium && totalItems >= 20) {
      alert('⭐ Free users can add up to 20 items. Upgrade to Premium for unlimited wardrobe!')
      return
    }

    // Open modal
    setUploadingCategory(category)
    setSelectedFile(file)
    setItemName(file.name.replace(/\.[^/.]+$/, ''))
    setItemColor('')
    setItemBrand('')
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(file)
    
    setShowUploadModal(true)
  }

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
      tops: '👕',
      bottoms: '👖',
      shoes: '👟',
      accessories: '🎒',
      outerwear: '🧥'
    }
    return icons[category] || '👔'
  }

  const categories = [
    { id: 'tops', name: 'Tops', icon: getCategoryIcon('tops') },
    { id: 'bottoms', name: 'Bottoms', icon: getCategoryIcon('bottoms') },
    { id: 'shoes', name: 'Shoes', icon: getCategoryIcon('shoes') },
    { id: 'outerwear', name: 'Outerwear', icon: getCategoryIcon('outerwear') },
    { id: 'accessories', name: 'Accessories', icon: getCategoryIcon('accessories') }
  ]

  if (loading) {
    return (
      <div className="wardrobe-page">
        <div className="wardrobe-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="grid-overlay"></div>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your wardrobe...</p>
        </div>
      </div>
    )
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
            Dashboard
          </button>
          
          <div className="nav-actions">
            {!isPremium && (
              <SimpleUpgradeButton 
                text="⭐ Upgrade"
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
              {isPremium ? 'Premium Wardrobe' : 'Free Wardrobe'}
            </div>
            <h1 className="header-title">Virtual Wardrobe</h1>
            <p className="header-subtitle">Your digital closet powered by AI</p>

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

        {/* Weather Widget (if available) */}
        {weather && !loadingWeather && (
          <div className="weather-widget">
            <div className="weather-info">
              <span className="weather-icon">{weather.icon}</span>
              <div className="weather-details">
                <div className="weather-temp">{weather.temp}°C</div>
                <div className="weather-desc">{weather.condition}</div>
              </div>
            </div>
            <button className="btn-weather-outfits" onClick={generateOutfits}>
              Generate Weather Outfits
            </button>
          </div>
        )}

        {loadingWeather && (
          <div className="weather-widget">
            <div className="weather-loading">
              <div className="spinner"></div>
              <p>Getting your local weather...</p>
            </div>
          </div>
        )}

        {locationPermission === 'denied' && (
          <div className="weather-widget" style={{background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
            <div className="weather-info">
              <span style={{fontSize: '2rem'}}>📍</span>
              <div className="weather-details">
                <div style={{fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)'}}>Location Access Denied</div>
                <div style={{fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)'}}>Enable location to get weather-based outfit suggestions</div>
              </div>
            </div>
            <button className="btn-weather-outfits" onClick={requestLocationAndWeather}>
              Try Again
            </button>
          </div>
        )}

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
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            AI Insights
          </button>
        </div>

        {/* Main Content Area */}
        <div className="content-area">
          {/* MY CLOSET TAB */}
          {activeTab === 'closet' && (
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
                    <span>📸 Upload photos of your clothes</span>
                    <span>🤖 Get AI outfit suggestions</span>
                    <span>👔 Never wonder what to wear again</span>
                  </div>
                  
                  {/* Add Quick Upload Button */}
                  <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '2rem auto 0'}}>
                    <button className="btn-primary" onClick={handleQuickUpload}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Upload Your First Item
                    </button>
                    <p style={{fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0}}>
                      {isPremium ? 'Unlimited items' : 'Free users: 20 items max'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {categories.map(category => (
                    <div key={category.id} className="category-section">
                      <div className="category-header">
                        <div className="category-title-group">
                          <span className="category-icon">{category.icon}</span>
                          <h3 className="category-title">{category.name}</h3>
                          <span className="category-count">{wardrobe[category.id].length} items</span>
                        </div>
                        
                        <label className="upload-label">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, category.id)}
                            disabled={uploadingCategory === category.id}
                            style={{ display: 'none' }}
                          />
                          <span className="upload-btn">
                            {uploadingCategory === category.id ? (
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
                        {wardrobe[category.id].map(item => (
                          <div key={item.id} className="item-card">
                            <div className="item-image-container">
                              <img src={item.image_data} alt={item.name} className="item-image" />
                              <button
                                className="delete-btn"
                                onClick={() => deleteItem(item.id, category.id)}
                                title="Remove item"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </button>
                              {item.color && item.color !== 'unspecified' && (
                                <div className="color-badge">{item.color}</div>
                              )}
                            </div>
                            <div className="item-details">
                              <p className="item-name">{item.name}</p>
                              {item.times_worn > 0 && (
                                <p className="item-worn">Worn {item.times_worn}x</p>
                              )}
                            </div>
                          </div>
                        ))}

                        {wardrobe[category.id].length === 0 && (
                          <div className="empty-category">
                            <span className="empty-category-icon">{category.icon}</span>
                            <p className="empty-category-text">No {category.name.toLowerCase()} yet</p>
                            <p className="empty-category-hint">Click "Add Item" to upload</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {getTotalItems() >= 3 && (
                    <div className="generate-section">
                      <button className="btn-generate" onClick={generateOutfits}>
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

          {/* OUTFITS TAB */}
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
                  <button className="btn-primary" onClick={() => setActiveTab('closet')}>
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

          {/* AI INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <div className="insights-view">
              <div className="empty-state">
                <div className="empty-icon">💡</div>
                <h3>AI Style Insights</h3>
                <p>Get personalized recommendations based on your wardrobe analytics</p>
                {!isPremium ? (
                  <SimpleUpgradeButton text="⭐ Upgrade to Premium" />
                ) : (
                  <button className="btn-primary">Coming Soon</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Add {uploadingCategory?.charAt(0).toUpperCase() + uploadingCategory?.slice(1)}</h2>
              <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>✕</button>
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
            <button className="btn-secondary" onClick={() => setShowUploadModal(false)} disabled={uploadingFile}>
              Cancel
            </button>
            <button className="btn-primary" onClick={confirmUpload} disabled={!itemName.trim() || uploadingFile}>
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