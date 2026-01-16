// 💬 PREMIUM STYLE CHAT - AI Fashion Chatbot Component
// Personalized fashion advice for premium users

import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'

function PremiumStyleChat({ rating, feedback, occasion, imagePreview }) {
  const { isPremium } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const messagesEndRef = useRef(null)
  const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize chat with welcome message
  useEffect(() => {
    if (isPremium) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! 👋 I'm your AI style consultant. I see you got a ${rating}/10 for your ${occasion === 'none' ? 'outfit' : occasion + ' outfit'}. I'm here to help with any questions about alternatives, accessories, or styling tips. What would you like to know?`,
          timestamp: new Date()
        }
      ])
    }
  }, [isPremium, rating, occasion])

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    // Check premium status
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/style-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory: messages,
          outfitContext: {
            rating,
            feedback,
            occasion,
            hasImage: !!imagePreview
          }
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to get response')

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickSuggestions = [
    "What if I don't have that color?",
    "Suggest cheaper alternatives",
    "What shoes go with this?",
    "What accessories should I add?"
  ]

  const handleQuickSuggestion = (suggestion) => {
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }
    setInput(suggestion)
  }

  return (
    <div className="premium-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-title">
            <h3>AI Style Consultant</h3>
            {isPremium ? (
              <span className="chat-status online">● Available</span>
            ) : (
              <span className="chat-status premium-only"> Premium Only</span>
            )}
          </div>
        </div>
        {isPremium && (
          <div className="chat-badge">
            <span className="premium-badge-small"> Premium</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className={`chat-messages ${!isPremium ? 'locked' : ''}`}>
        {isPremium ? (
          <>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`chat-message ${msg.role} ${msg.isError ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="chat-locked-overlay">
            <div className="locked-content">
              <h3>Premium Feature</h3>
              <p>Get personalized fashion advice from our AI style consultant</p>
              <ul className="locked-features">
                <li> Real-time styling suggestions</li>
                <li> Alternative outfit ideas</li>
                <li> Budget-friendly recommendations</li>
                <li> Color & accessory advice</li>
              </ul>
              <button 
                className="unlock-button"
                onClick={() => setShowUpgradeModal(true)}
              >
                Unlock for $4.99/month
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      {isPremium && messages.length > 0 && !loading && (
        <div className="quick-suggestions">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-chip"
              onClick={() => handleQuickSuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className={`chat-input-container ${!isPremium ? 'locked' : ''}`}>
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isPremium ? "Ask about alternatives, accessories, colors..." : "Upgrade to chat with AI stylist"}
            disabled={!isPremium || loading}
            className="chat-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!isPremium || loading || !input.trim()}
            className="send-button"
          >
            // FIXED:
          {loading ? (
            <span className="send-spinner"></span>
          ) : (
            <span>→</span>
          )}
          </button>
        </div>
        {!isPremium && (
          <div className="input-locked-overlay" onClick={() => setShowUpgradeModal(true)}>
            <span>Premium Feature</span>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="upgrade-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowUpgradeModal(false)}
            >
              ×
            </button>
            
            <div className="modal-header-upgrade">
              <h2>Unlock AI Style Consultant</h2>
              <p>Get personalized fashion advice in real-time</p>
            </div>

            <div className="premium-features-grid">
              <div className="premium-feature-item">
                <h4>Chat with AI Stylist</h4>
                <p>Ask unlimited questions about your outfit</p>
              </div>
              <div className="premium-feature-item">
                <h4>Alternative Suggestions</h4>
                <p>Get options for items you don't have</p>
              </div>
              <div className="premium-feature-item">
                <h4>Budget Tips</h4>
                <p>Find affordable alternatives to expensive pieces</p>
              </div>
              <div className="premium-feature-item">
                <h4>Color & Accessory Advice</h4>
                <p>Perfect your look with expert recommendations</p>
              </div>
            </div>

            <div className="pricing-box">
              <div className="price-amount">$4.99<span>/month</span></div>
              <p className="price-description">Full access to all premium features</p>
            </div>

            <button 
              className="upgrade-now-button"
              onClick={() => alert('Premium coming soon!')}
            >
              Upgrade to Premium
            </button>

            <p className="modal-footer-text">
              Cancel anytime • No commitment
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PremiumStyleChat