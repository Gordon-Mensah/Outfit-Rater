// StyleContext.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import { cities, workplaces, socialScenes, ageGroups } from './contextData'
import './StyleContext.css'

function StyleContext() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // State to store user's selections
  const [context, setContext] = useState({
    city: '',
    workplace: '',
    socialScene: '',
    ageGroup: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load existing context when page opens
  useEffect(() => {
    loadContext()
  }, [user])

  const loadContext = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('style_context')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      // If user has saved context, load it
      if (data?.style_context) {
        setContext(data.style_context)
      }
    } catch (err) {
      console.error('Error loading context:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    // Validation: make sure at least city is selected
    if (!context.city) {
      alert('Please select your city')
      return
    }
    
    setSaving(true)
    
    try {
      // Add timestamp
      const contextToSave = {
        ...context,
        updatedAt: new Date().toISOString()
      }
      
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({ style_context: contextToSave })
        .eq('id', user.id)
      
      if (error) throw error
      
      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      console.log('Context saved successfully!')
    } catch (err) {
      console.error('Error saving context:', err)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    navigate('/rate')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="context-page">
      {/* Background */}
      <div className="context-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="context-content">
        {/* Header */}
        <div className="context-header">
          <button onClick={() => navigate('/rate')} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Back
          </button>
        </div>

        {/* Main Card */}
        <div className="context-card">
          <div className="context-card-header">
            <h1>Your Style Context</h1>
            <p>Help us give you more accurate, personalized fashion feedback based on where you are and what you do.</p>
          </div>

          <div className="context-form">
            {/* City Selection */}
            <div className="form-group">
              <label htmlFor="city">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2"/>
                  <circle cx="12" cy="10" r="3" strokeWidth="2"/>
                </svg>
                Your City
              </label>
              <select 
                id="city"
                value={context.city} 
                onChange={(e) => setContext({...context, city: e.target.value})}
                className="context-select"
              >
                <option value="">Select your city...</option>
                {cities.map(city => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">Fashion norms vary by location. We'll consider your local climate and culture.</p>
            </div>

            {/* Workplace Selection */}
            <div className="form-group">
              <label htmlFor="workplace">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2"/>
                  <line x1="9" y1="15" x2="15" y2="15" strokeWidth="2"/>
                </svg>
                Your Workplace/Lifestyle
              </label>
              <select 
                id="workplace"
                value={context.workplace} 
                onChange={(e) => setContext({...context, workplace: e.target.value})}
                className="context-select"
              >
                <option value="">Select your workplace type...</option>
                {workplaces.map(workplace => (
                  <option key={workplace.value} value={workplace.value}>
                    {workplace.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">Different workplaces have different dress expectations.</p>
            </div>

            {/* Social Scene Selection */}
            <div className="form-group">
              <label htmlFor="socialScene">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                  <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
                </svg>
                Your Social Scene
              </label>
              <select 
                id="socialScene"
                value={context.socialScene} 
                onChange={(e) => setContext({...context, socialScene: e.target.value})}
                className="context-select"
              >
                <option value="">Select your social scene...</option>
                {socialScenes.map(scene => (
                  <option key={scene.value} value={scene.value}>
                    {scene.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">Your social environment influences what's considered stylish.</p>
            </div>

            {/* Age Group Selection */}
            <div className="form-group">
              <label htmlFor="ageGroup">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                </svg>
                Age Group (Optional)
              </label>
              <select 
                id="ageGroup"
                value={context.ageGroup} 
                onChange={(e) => setContext({...context, ageGroup: e.target.value})}
                className="context-select"
              >
                <option value="">Prefer not to say</option>
                {ageGroups.map(age => (
                  <option key={age.value} value={age.value}>
                    {age.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">Age-appropriate fashion varies across generations.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="context-actions">
            <button 
              className="btn-secondary"
              onClick={handleSkip}
            >
              Skip for Now
            </button>
            <button 
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !context.city}
            >
              {saving ? (
                <>
                  <div className="button-spinner"></div>
                  Saving...
                </>
              ) : (
                'Save Context'
              )}
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="success-message">
              Context saved! Your ratings will now be more personalized.
            </div>
          )}

          {/* Info Box */}
          <div className="info-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2"/>
            </svg>
            <p>Your context is private and only used to personalize your outfit ratings. You can update it anytime.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StyleContext