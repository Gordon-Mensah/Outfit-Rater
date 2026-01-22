// VirtualWardrobe_Enhanced.jsx - ENHANCED with Color Detection, Weather, AI Generation
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'
import SimpleUpgradeButton from './SimpleUpgradeButton'
import { extractDominantColor, getColorName } from './colorDetection'
import { generateAIOutfits, analyzeWardrobeGaps } from './aiOutfitGenerator'
import { getWeatherSuggestions } from './weatherIntegration'

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
  const [weather, setWeather] = useState(null)
  const [weatherOutfits, setWeatherOutfits] = useState([])
  const [aiSuggestions, setAiSuggestions] = useState([])

  useEffect(() => {
    if (user) {
      loadWardrobe()
      loadWeather()
    }
  }, [user])

  // 🌤️ WEATHER INTEGRATION
  const loadWeather = async () => {
    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords
          
          // Free weather API - OpenWeatherMap
          const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo'
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
          )
          
          if (response.ok) {
            const data = await response.json()
            setWeather({
              temp: Math.round(data.main.temp),
              condition: data.weather[0].main,
              description: data.weather[0].description,
              icon: data.weather[0].icon
            })
          }
        })
      }
    } catch (error) {
      console.error('Weather fetch error:', error)
    }
  }

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

  // 🎨 COLOR DETECTION on upload
  const handleImageUpload = async (e, category) => {
    const file = e.target.files?.[0]
    if (!file) return

    const totalItems = Object.values(wardrobe).flat().length
    if (!isPremium && totalItems >= 20) {
      alert(' Free users can add up to 20 items. Upgrade to Premium for unlimited wardrobe!')
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

      // 🎨 EXTRACT DOMINANT COLOR
      const dominantColor = await extractDominantColor(base64)
      const colorName = getColorName(dominantColor)

      // Save to database with auto-detected color
      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: user.id,
          category: category,
          image_data: base64,
          name: file.name,
          color: colorName, // 🎨 AUTO-DETECTED COLOR
          color_hex: dominantColor,
          last_worn: null,
          times_worn: 0
        })
        .select()
        .single()

      if (error) throw error

      setWardrobe(prev => ({
        ...prev,
        [category]: [...prev[category], data]
      }))

      alert(`✅ ${file.name} added! Detected color: ${colorName}`)
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

  //  ENHANCED AI OUTFIT GENERATION
  const generateOutfits = async () => {
    const totalItems = Object.values(wardrobe).flat().length
    
    if (totalItems < 3) {
      alert('Add at least 3 items to your wardrobe to generate outfits!')
      return
    }

    setLoading(true)
    setActiveTab('outfits')

    try {
      let outfits = []
      
      if (isPremium) {
        //  PREMIUM: Real AI Generation with color matching
        outfits = await generateAIOutfits(wardrobe, 'casual', weather?.condition || 'moderate', 5)
      } else {
        // Free: Basic random generation
        outfits = generateBasicOutfits(wardrobe, 3)
      }

      setGeneratedOutfits(outfits)
    } catch (err) {
      console.error('Error generating outfits:', err)
      alert('Failed to generate outfits')
    } finally {
      setLoading(false)
    }
  }

  // Basic outfit generation (free tier)
  const generateBasicOutfits = (wardrobe, count) => {
    const { tops, bottoms, shoes, outerwear, accessories } = wardrobe
    const outfits = []

    for (let i = 0; i < Math.min(count, tops.length); i++) {
      const outfit = {
        id: `outfit-${i}`,
        top: tops[i] || tops[0],
        bottom: bottoms[Math.floor(Math.random() * bottoms.length)],
        shoes: shoes[Math.floor(Math.random() * shoes.length)],
        outerwear: outerwear.length > 0 ? outerwear[Math.floor(Math.random() * outerwear.length)] : null,
        accessory: accessories.length > 0 ? accessories[Math.floor(Math.random() * accessories.length)] : null,
        occasion: ['casual', 'work', 'date', 'night out'][Math.floor(Math.random() * 4)],
        times_worn: 0
      }
      outfits.push(outfit)
    }

    return outfits
  }

  // 🌤️ WEATHER-BASED OUTFIT SUGGESTIONS
  const generateWeatherOutfits = async () => {
    if (!weather) {
      alert('Enable location access to get weather-based suggestions!')
      return
    }

    setLoading(true)

    try {
      const suggestions = await getWeatherSuggestions(wardrobe, weather)
      setWeatherOutfits(suggestions)
      alert(`📍 Outfits for ${weather.temp}°C, ${weather.description}`)
    } catch (error) {
      console.error('Weather outfit error:', error)
      alert('Failed to generate weather outfits')
    } finally {
      setLoading(false)
    }
  }

  // 👔 MARK OUTFIT AS WORN (Wear Counter)
  const markOutfitWorn = async (outfit) => {
    if (!confirm('Mark this outfit as worn today?')) return

    try {
      // Update each item's wear counter
      const itemsToUpdate = [
        outfit.top,
        outfit.bottom,
        outfit.shoes,
        outfit.outerwear,
        outfit.accessory
      ].filter(Boolean)

      for (const item of itemsToUpdate) {
        await supabase
          .from('wardrobe_items')
          .update({
            times_worn: (item.times_worn || 0) + 1,
            last_worn: new Date().toISOString()
          })
          .eq('id', item.id)
      }

      // Reload wardrobe to show updated counts
      await loadWardrobe()
      
      alert('Outfit marked as worn! Wear counts updated.')
    } catch (error) {
      console.error('Error updating wear count:', error)
      alert('Failed to update wear count')
    }
  }

  // 🔍 GET AI WARDROBE ANALYSIS (Premium)
  const getAIAnalysis = async () => {
    if (!isPremium) {
      alert('⭐ Premium feature! Upgrade to get AI wardrobe analysis.')
      return
    }

    setLoading(true)

    try {
      const suggestions = await analyzeWardrobeGaps(wardrobe)
      setAiSuggestions(suggestions)
      setActiveTab('suggestions')
    } catch (error) {
      console.error('AI analysis error:', error)
      alert('Failed to analyze wardrobe')
    } finally {
      setLoading(false)
    }
  }

  // 📊 Get underutilized items
  const getUnderutilizedItems = () => {
    const allItems = Object.values(wardrobe).flat()
    return allItems
      .filter(item => item.times_worn !== undefined)
      .sort((a, b) => a.times_worn - b.times_worn)
      .slice(0, 5)
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
                 Virtual Wardrobe
                <span className="premium-indicator">{isPremium ? '⭐ Premium' : '🆓 Free'}</span>
              </h1>
              <p className="page-subtitle">
                Upload your clothes and get AI-powered outfit combinations
              </p>
            </div>
            <HamburgerMenu />
          </div>
        </div>

        {/* 🌤️ WEATHER WIDGET */}
        {weather && (
          <div className="weather-widget">
            <div className="weather-info">
              <img 
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                className="weather-icon"
              />
              <div className="weather-details">
                <div className="weather-temp">{weather.temp}°C</div>
                <div className="weather-desc">{weather.description}</div>
              </div>
            </div>
            <button 
              className="btn-weather-outfits"
              onClick={generateWeatherOutfits}
            >
               Outfits for Today's Weather
            </button>
          </div>
        )}

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
            <span>My Closet</span>
            <span className="tab-count">{getTotalItems()}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'outfits' ? 'active' : ''}`}
            onClick={() => setActiveTab('outfits')}
          >
            <span>Generated Outfits</span>
            <span className="tab-count">{generatedOutfits.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <span>AI Suggestions</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <span>Wear Insights</span>
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
                            <span> Detecting color...</span>
                          ) : (
                            <span> Add Item</span>
                          )}
                        </label>
                      </div>

                      <div className="items-grid">
                        {wardrobe[category].map(item => (
                          <div key={item.id} className="wardrobe-item-card">
                            <div className="item-image-wrapper">
                              <img src={item.image_data} alt={item.name} />
                              
                              {/* 🎨 COLOR BADGE */}
                              {item.color && item.color !== 'unspecified' && (
                                <div className="color-badge" style={{ backgroundColor: item.color_hex }}>
                                  {item.color}
                                </div>
                              )}
                              
                              <button
                                className="delete-item-btn"
                                onClick={() => deleteItem(item.id, category)}
                              >
                                Delete
                              </button>
                            </div>
                            <div className="item-info">
                              <p className="item-name">{item.name}</p>
                              {/*  WEAR COUNTER */}
                              {item.times_worn > 0 && (
                                <p className="item-worn">Worn {item.times_worn}x</p>
                              )}
                              {item.last_worn && (
                                <p className="item-last-worn">
                                  Last worn: {new Date(item.last_worn).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        {wardrobe[category].length === 0 && (
                          <div className="empty-category">
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
                         Generate Outfit Combinations
                        {isPremium && <span className="ai-badge">AI-Powered</span>}
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
                    <h2>
                      {isPremium ? ' AI-Generated Outfits' : 'Outfit Combinations'}
                    </h2>
                    <button className="btn-refresh-outfits" onClick={generateOutfits}>
                      Generate New Outfits
                    </button>
                  </div>

                  <div className="outfits-grid">
                    {generatedOutfits.map((outfit, index) => (
                      <div key={outfit.id} className="outfit-combo-card">
                        <div className="outfit-number">Outfit #{index + 1}</div>
                        <div className="outfit-occasion-badge">{outfit.occasion}</div>
                        
                        {/* WEAR COUNTER for outfit */}
                        {outfit.times_worn > 0 && (
                          <div className="outfit-wear-badge">
                            Worn {outfit.times_worn}x
                          </div>
                        )}
                        
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

                        {/* ✨ PREMIUM: AI Reasoning */}
                        {isPremium && outfit.reasoning && (
                          <div className="outfit-reasoning">
                            <p className="reasoning-title">Why this works:</p>
                            <p className="reasoning-text">{outfit.reasoning}</p>
                          </div>
                        )}

                        <div className="outfit-actions">
                          <button 
                            className="btn-rate-outfit"
                            onClick={() => markOutfitWorn(outfit)}
                          >
                             Mark as Worn Today
                          </button>
                        </div>
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
                <h2> AI Shopping Suggestions</h2>
                <p>Based on your current wardrobe, here's what might complete your style</p>
                {isPremium && (
                  <button className="btn-analyze" onClick={getAIAnalysis}>
                     Get AI Analysis
                  </button>
                )}
              </div>

              <div className="suggestions-grid">
                {aiSuggestions.length > 0 ? (
                  aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card">
                      <div className="suggestion-icon">
                        {suggestion.category === 'tops' }
                        {suggestion.category === 'bottoms' }
                        {suggestion.category === 'shoes'}
                        {suggestion.category === 'outerwear' }
                        {suggestion.category === 'accessories' }
                      </div>
                      <h3>{suggestion.item}</h3>
                      <p>{suggestion.reason}</p>
                      <div className="suggestion-meta">
                        <span className={`suggestion-priority ${suggestion.priority}`}>
                          {suggestion.priority} priority
                        </span>
                        <span className="suggestion-price">{suggestion.price_range}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="suggestion-card premium-suggestion">
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
                )}
              </div>
            </div>
          )}

          {/*  WEAR INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <div className="insights-view">
              <div className="insights-header">
                <h2>Wear Insights</h2>
                <p>See which items you love and which ones need more attention</p>
              </div>

              <div className="insights-grid">
                {/* Underutilized Items */}
                <div className="insight-card">
                  <h3> Least Worn Items</h3>
                  <p>These items are collecting dust in your wardrobe!</p>
                  <div className="insight-items">
                    {getUnderutilizedItems().map(item => (
                      <div key={item.id} className="insight-item">
                        <img src={item.image_data} alt={item.name} />
                        <div className="insight-item-info">
                          <p className="insight-item-name">{item.name}</p>
                          <p className="insight-item-stat">Worn {item.times_worn || 0}x</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Worn by Category */}
                <div className="insight-card">
                  <h3> Your Favorites</h3>
                  <p>Items you wear most often</p>
                  <div className="insight-items">
                    {Object.values(wardrobe)
                      .flat()
                      .filter(item => item.times_worn > 0)
                      .sort((a, b) => b.times_worn - a.times_worn)
                      .slice(0, 5)
                      .map(item => (
                        <div key={item.id} className="insight-item favorite">
                          <img src={item.image_data} alt={item.name} />
                          <div className="insight-item-info">
                            <p className="insight-item-name">{item.name}</p>
                            <p className="insight-item-stat">Worn {item.times_worn}x ⭐</p>
                          </div>
                        </div>
                      ))}
                  </div>
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