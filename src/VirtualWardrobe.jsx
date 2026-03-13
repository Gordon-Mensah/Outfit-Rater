// VirtualWardrobe.jsx - Complete with Style Memory System + Full Category Structure
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import SimpleUpgradeButton from './SimpleUpgradeButton'
import StyleInsights from './StyleInsights'
import './VirtualWardrobe.css'
import { 
  getUserWeatherTwoDays, 
  getTodayTomorrowOutfits,
  fetchWeather
} from './weatherIntegration'
import { 
  createEmptyStyleProfile,
  trackStyleAction,
  extractStyleAttributes 
} from './styleMemory'

// ─────────────────────────────────────────────
// FULL CATEGORY + SUBCATEGORY STRUCTURE
// ─────────────────────────────────────────────
export const CATEGORY_STRUCTURE = {
  tops: {
    name: 'Tops',
    icon: '👕',
    subcategories: [
      'T-Shirts', 'Shirts', 'Hoodies', 'Sweatshirts', 'Tanks',
      'Polos', 'Blazers', 'Jackets', 'Cardigans', 'Crop Tops'
    ]
  },
  bottoms: {
    name: 'Bottoms',
    icon: '👖',
    subcategories: [
      'Jeans', 'Trousers', 'Shorts', 'Joggers', 'Sweatpants',
      'Skirts', 'Leggings', 'Chinos'
    ]
  },
  shoes: {
    name: 'Shoes',
    icon: '👟',
    subcategories: [
      'Sneakers', 'Boots', 'Sandals', 'Formal Shoes',
      'Loafers', 'Slides', 'Heels', 'Trainers'
    ]
  },
  outerwear: {
    name: 'Outerwear',
    icon: '🧥',
    subcategories: [
      'Coats', 'Parkas', 'Raincoats', 'Puffer Jackets',
      'Leather Jackets', 'Windbreakers'
    ]
  },
  accessories: {
    name: 'Accessories',
    icon: '💍',
    subcategories: [
      'Chains', 'Rings', 'Watches', 'Bracelets', 'Earrings',
      'Necklaces', 'Hats', 'Caps', 'Beanies', 'Bandanas',
      'Handkerchiefs', 'Belts', 'Sunglasses', 'Bags', 'Wallets',
      'Scarves', 'Ties', 'Socks'
    ]
  },
  sportswear: {
    name: 'Sportswear',
    icon: '🏋️',
    subcategories: [
      'Sports Tops', 'Sports Bottoms', 'Sports Shoes', 'Gym Wear'
    ]
  },
  formalwear: {
    name: 'Formalwear',
    icon: '🤵',
    subcategories: [
      'Suits', 'Dress Shirts', 'Dress Shoes', 'Ties', 'Waistcoats'
    ]
  }
}

const CATEGORY_KEYS = Object.keys(CATEGORY_STRUCTURE)

function getCategoryIcon(categoryId) {
  return CATEGORY_STRUCTURE[categoryId]?.icon || '👔'
}

function buildEmptyWardrobe() {
  return CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = []
    return acc
  }, {})
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
function VirtualWardrobe() {
  const { user, isPremium } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('closet')
  const [wardrobe, setWardrobe] = useState(buildEmptyWardrobe())
  
  // Style Memory State
  const [styleProfile, setStyleProfile] = useState(null)
  
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
  const [itemSubcategory, setItemSubcategory] = useState('')

  // Weather State
  const [weather, setWeather] = useState(null)
  const [locationPermission, setLocationPermission] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [twoDayWeather, setTwoDayWeather] = useState(null)
  const [twoDayOutfits, setTwoDayOutfits] = useState(null)

  // Load wardrobe and weather on mount
  useEffect(() => {
    if (user) {
      loadWardrobe()
      loadStyleProfile()
      loadTwoDayWeather()
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
      
      const organized = buildEmptyWardrobe()
      
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

  // Load user's style profile
  const loadStyleProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('style_profile')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      
      if (data?.style_profile) {
        setStyleProfile(data.style_profile)
        console.log('Style profile loaded, learning score:', data.style_profile.stats.learningScore)
      } else {
        const newProfile = createEmptyStyleProfile()
        setStyleProfile(newProfile)
        await supabase
          .from('profiles')
          .update({ style_profile: newProfile })
          .eq('user_id', user.id)
        console.log('New style profile created')
      }
    } catch (err) {
      console.error('Error loading style profile:', err)
    }
  }

  const saveStyleProfile = async (updatedProfile) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ style_profile: updatedProfile })
        .eq('user_id', user.id)
      if (error) throw error
      console.log('Style profile saved')
    } catch (err) {
      console.error('Error saving style profile:', err)
    }
  }

  const loadTwoDayWeather = async () => {
    try {
      const { weather } = await getUserWeatherTwoDays()
      setTwoDayWeather(weather)
      const outfits = getTodayTomorrowOutfits(wardrobe, weather.today, weather.tomorrow)
      setTwoDayOutfits(outfits)
    } catch (err) {
      console.error("Two-day weather error:", err)
    }
  }

  const requestLocationAndWeather = async () => {
    setLoadingWeather(true)
    
    if (!navigator.geolocation) {
      setLoadingWeather(false)
      return
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })
      setLocationPermission('granted')
      
      const { latitude, longitude } = position.coords
      const data = await fetchWeather(latitude, longitude)
      
      if (data) {
        const weatherIcons = {
          'Clear': '☀️', 'Mainly Clear': '🌤️', 'Partly Cloudy': '⛅',
          'Cloudy': '☁️', 'Fog': '🌫️', 'Light Drizzle': '🌦️',
          'Drizzle': '🌦️', 'Heavy Drizzle': '🌦️', 'Light Rain': '🌧️',
          'Rain': '🌧️', 'Heavy Rain': '🌧️', 'Snow': '❄️', 'Thunderstorm': '⛈️'
        }
        setWeather({ temp: data.temp, condition: data.condition, icon: weatherIcons[data.condition] || '🌤️' })
      } else {
        setWeather({ temp: 22, condition: 'Clear', icon: '☀️' })
      }
    } catch (error) {
      setLocationPermission('denied')
      setWeather({ temp: 22, condition: 'Clear', icon: '☀️' })
    } finally {
      setLoadingWeather(false)
    }
  }

  const handleQuickUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (file) handleImageUpload({ target: { files: [file] } }, 'tops')
    }
    input.click()
  }

  const handleImageUpload = async (e, category) => {
    const file = e.target.files?.[0]
    if (!file) return

    const totalItems = Object.values(wardrobe).flat().length
    if (!isPremium && totalItems >= 20) {
      alert('Free users can add up to 20 items. Upgrade to Premium for unlimited wardrobe!')
      return
    }

    setUploadingCategory(category)
    setSelectedFile(file)
    setItemName(file.name.replace(/\.[^/.]+$/, ''))
    setItemColor('')
    setItemBrand('')
    setItemSubcategory(CATEGORY_STRUCTURE[category]?.subcategories[0] || '')
    
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
          subcategory: itemSubcategory || null,
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

      if (styleProfile) {
        const updatedProfile = trackStyleAction(styleProfile, 'UPLOAD', data, {})
        setStyleProfile(updatedProfile)
        await saveStyleProfile(updatedProfile)
        console.log('Tracked upload, learning score:', updatedProfile.stats.learningScore)
      }

      setShowUploadModal(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setItemName('')
      setItemColor('')
      setItemBrand('')
      setItemSubcategory('')
      
      alert('Item added to your wardrobe!')
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
      if (styleProfile) {
        const itemToDelete = wardrobe[category].find(item => item.id === itemId)
        if (itemToDelete) {
          const updatedProfile = trackStyleAction(styleProfile, 'DELETE', itemToDelete, {})
          setStyleProfile(updatedProfile)
          await saveStyleProfile(updatedProfile)
        }
      }

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

  const getTotalItems = () => Object.values(wardrobe).flat().length

  const categories = CATEGORY_KEYS.map(id => ({
    id,
    name: CATEGORY_STRUCTURE[id].name,
    icon: CATEGORY_STRUCTURE[id].icon
  }))

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
              <SimpleUpgradeButton text="Upgrade" className="nav-upgrade-btn" />
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

        {/* Weather Widget */}
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

        {/* Style Insights Component */}
        {styleProfile && (
          <StyleInsights 
            onGeneratePersonalized={(recommendation) => {
              console.log('User wants personalized outfit:', recommendation)
              generateOutfits()
            }}
          />
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
                    <span>Upload photos of your clothes</span>
                    <span>Get AI outfit suggestions</span>
                    <span>Never wonder what to wear again</span>
                  </div>
                  
                  <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '2rem auto 0'}}>
                    <button className="btn-primary" onClick={handleQuickUpload}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Upload Your First Item
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {categories.map(cat => (
                    <div key={cat.id} className="category-section">
                      <div className="category-header">
                        <div className="category-title-group">
                          <span className="category-icon">{cat.icon}</span>
                          <h3 className="category-title">{cat.name}</h3>
                          <span className="category-count">{wardrobe[cat.id].length} items</span>
                        </div>
                        
                        <label className="upload-label">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, cat.id)}
                            disabled={uploadingCategory === cat.id}
                            style={{ display: 'none' }}
                          />
                          <span className="upload-btn">
                            {uploadingCategory === cat.id ? (
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

                      {/* Subcategory breakdown (only shown if items exist) */}
                      {wardrobe[cat.id].length > 0 && (
                        <div className="subcategory-tabs">
                          {CATEGORY_STRUCTURE[cat.id].subcategories
                            .filter(sub => wardrobe[cat.id].some(item => item.subcategory === sub))
                            .map(sub => (
                              <span key={sub} className="subcategory-chip">
                                {sub}
                                <span className="subcategory-chip-count">
                                  {wardrobe[cat.id].filter(item => item.subcategory === sub).length}
                                </span>
                              </span>
                            ))
                          }
                          {wardrobe[cat.id].some(item => !item.subcategory) && (
                            <span className="subcategory-chip subcategory-chip--other">
                              Other
                              <span className="subcategory-chip-count">
                                {wardrobe[cat.id].filter(item => !item.subcategory).length}
                              </span>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="items-grid">
                        {wardrobe[cat.id].map(item => (
                          <div key={item.id} className="item-card">
                            <div className="item-image-container">
                              <img src={item.image_data} alt={item.name} className="item-image" />
                              {item.subcategory && (
                                <span className="item-subcategory-badge">{item.subcategory}</span>
                              )}
                              <button
                                className="delete-btn"
                                onClick={() => deleteItem(item.id, cat.id)}
                                title="Remove item"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                            <div className="item-details">
                              <p className="item-name">{item.name}</p>
                              {item.color && item.color !== 'unspecified' && (
                                <p className="item-color">{item.color}</p>
                              )}
                              {item.times_worn > 0 && (
                                <p className="item-worn">Worn {item.times_worn}x</p>
                              )}
                            </div>
                          </div>
                        ))}

                        {wardrobe[cat.id].length === 0 && (
                          <div className="empty-category">
                            <span className="empty-category-icon">{cat.icon}</span>
                            <p className="empty-category-text">No {cat.name.toLowerCase()} yet</p>
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
                              <span className="outfit-item-label">
                                {outfit.top.subcategory || 'Top'}
                              </span>
                            </div>
                          )}
                          {outfit.bottom && (
                            <div className="outfit-item">
                              <img src={outfit.bottom.image_data} alt="Bottom" />
                              <span className="outfit-item-label">
                                {outfit.bottom.subcategory || 'Bottom'}
                              </span>
                            </div>
                          )}
                          {outfit.shoes && (
                            <div className="outfit-item">
                              <img src={outfit.shoes.image_data} alt="Shoes" />
                              <span className="outfit-item-label">
                                {outfit.shoes.subcategory || 'Shoes'}
                              </span>
                            </div>
                          )}
                          {outfit.outerwear && (
                            <div className="outfit-item">
                              <img src={outfit.outerwear.image_data} alt="Outerwear" />
                              <span className="outfit-item-label">
                                {outfit.outerwear.subcategory || 'Outerwear'}
                              </span>
                            </div>
                          )}
                          {outfit.accessory && (
                            <div className="outfit-item">
                              <img src={outfit.accessory.image_data} alt="Accessory" />
                              <span className="outfit-item-label">
                                {outfit.accessory.subcategory || 'Accessory'}
                              </span>
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
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Add {CATEGORY_STRUCTURE[uploadingCategory]?.name}</h2>
              <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>
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
                {/* Subcategory selector */}
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={itemSubcategory}
                    onChange={(e) => setItemSubcategory(e.target.value)}
                    className="form-input form-select"
                  >
                    {CATEGORY_STRUCTURE[uploadingCategory]?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

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
                  disabled={!!uploadingFile}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={confirmUpload}
                  disabled={!itemName.trim() || !!uploadingFile}
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