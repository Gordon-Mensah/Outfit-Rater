// StylistSelector.jsx - Choose Your AI Stylist Personality
import { useState } from 'react'
import { getAllStylists } from './stylistPersonalities'
import './StylistSelector.css'

function StylistSelector({ currentStylist, onSelectStylist, onClose }) {
  const [selectedId, setSelectedId] = useState(currentStylist)
  const stylists = getAllStylists()

  const handleSelect = (stylistId) => {
    setSelectedId(stylistId)
  }

  const handleConfirm = () => {
    onSelectStylist(selectedId)
    onClose()
  }

  const selectedStylist = stylists.find(s => s.id === selectedId)

  return (
    <div className="stylist-selector-overlay" onClick={onClose}>
      <div className="stylist-selector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stylist-selector-header">
          <div>
            <h2>Choose Your AI Stylist</h2>
            <p>Each stylist has a unique personality and style perspective</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Stylist Grid */}
        <div className="stylist-grid">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className={`stylist-card ${selectedId === stylist.id ? 'selected' : ''}`}
              onClick={() => handleSelect(stylist.id)}
            >
              {/* Icon & Name */}
              <div className="stylist-icon">{stylist.icon}</div>
              <h3 className="stylist-name">{stylist.name}</h3>
              <p className="stylist-tagline">"{stylist.tagline}"</p>
              
              {/* Personality Badge */}
              <div className="stylist-personality">{stylist.personality}</div>
              
              {/* Description */}
              <p className="stylist-description">{stylist.description}</p>
              
              {/* Selection Indicator */}
              {selectedId === stylist.id && (
                <div className="selected-indicator">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Preview Panel */}
        {selectedStylist && (
          <div className="stylist-preview">
            <div className="preview-header">
              <span className="preview-icon">{selectedStylist.icon}</span>
              <div>
                <h3>{selectedStylist.name}</h3>
                <p className="preview-personality">{selectedStylist.personality}</p>
              </div>
            </div>

            <div className="preview-sections">
              {/* Sample Feedback */}
              <div className="preview-section">
                <h4> How {selectedStylist.name} talks:</h4>
                <div className="feedback-samples">
                  <div className="feedback-sample positive">
                    <strong>When you nail it:</strong>
                    <p>"{selectedStylist.voiceStyle.feedback.positive}"</p>
                  </div>
                  <div className="feedback-sample negative">
                    <strong>When it needs work:</strong>
                    <p>"{selectedStylist.voiceStyle.feedback.negative}"</p>
                  </div>
                </div>
              </div>

              {/* Style Preferences */}
              <div className="preview-section">
                <h4> Style Preferences:</h4>
                <div className="preferences-grid">
                  <div className="pref-item">
                    <span className="pref-label">Loves:</span>
                    <span className="pref-value">
                      {selectedStylist.preferences.colorPalette.slice(0, 4).join(', ')}
                    </span>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Avoids:</span>
                    <span className="pref-value">
                      {selectedStylist.preferences.avoidColors.join(', ')}
                    </span>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Vibe:</span>
                    <span className="pref-value">{selectedStylist.preferences.style}</span>
                  </div>
                </div>
              </div>

              {/* Signature Phrases */}
              <div className="preview-section">
                <h4> Signature Phrases:</h4>
                <div className="phrases-list">
                  {selectedStylist.voiceStyle.phrases.slice(0, 3).map((phrase, i) => (
                    <span key={i} className="phrase-badge">"{phrase}"</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="stylist-selector-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm}>
            <span className="selected-stylist-icon">{selectedStylist?.icon}</span>
            Choose {selectedStylist?.name}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StylistSelector