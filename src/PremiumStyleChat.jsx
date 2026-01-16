// PremiumStyleChat.jsx - AI Fashion Chatbot Component
import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function PremiumStyleChat({ rating, feedback, occasion, imagePreview }) {
  const { user, isPremium } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = {
      role: 'assistant',
      content: `👋 Hi! I'm your AI Style Coach. I just analyzed your ${occasion} outfit and gave it a ${rating}/10.\n\nI can help you:\n• Find alternatives for items you don't have\n• Suggest accessories to complete the look\n• Adjust colors to match your wardrobe\n• Answer any style questions\n\nWhat would you like to know?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [rating, occasion])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    // Check if premium
    if (!isPremium) {
      setShowUpgrade(true)
      return
    }

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Build conversation context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      conversationHistory.push({
        role: 'user',
        content: input
      })

      // Call AI API with full context
      const response = await fetch(`${API_BASE_URL}/api/style-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          conversation: conversationHistory,
          outfitContext: {
            rating,
            feedback,
            occasion,
            imagePreview
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
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Quick suggestion buttons
  const quickSuggestions = [
    "I don't have that color, what else works?",
    "What accessories should I add?",
    "Can you suggest budget-friendly alternatives?",
    "How can I make this more casual/formal?"
  ]

  const handleQuickSuggestion = (suggestion) => {
    setInput(suggestion)
  }

  return (
    <div className="premium-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-icon">💬</div>
          <div>
            <h3>AI Style Coach</h3>
            <p className="chat-subtitle">Ask me anything about your outfit</p>
          </div>
        </div>
        {isPremium && (
          <span className="premium-badge-chat">⭐ Premium</span>
        )}
      </div>

      {/* Chat Messages */}
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="chat-message assistant-message">
            <div className="message-avatar">🤖</div>
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
      </div>

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="quick-suggestions">
          <p className="suggestions-label">Quick questions:</p>
          <div className="suggestions-grid">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickSuggestion(suggestion)}
                className="suggestion-btn"
                disabled={!isPremium}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-container">
        {!isPremium && (
          <div className="premium-overlay-chat">
            <div className="overlay-content">
              <span className="lock-icon">🔒</span>
              <h4>Premium Feature</h4>
              <p>Upgrade to Premium to chat with your AI Style Coach</p>
              <button 
                className="btn-upgrade-chat"
                onClick={() => setShowUpgrade(true)}
              >
                Upgrade Now - $4.99/month
              </button>
            </div>
          </div>
        )}
        
        <div className={`chat-input-wrapper ${!isPremium ? 'disabled' : ''}`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isPremium ? "Ask about alternatives, colors, accessories..." : "Upgrade to Premium to unlock chat"}
            disabled={loading || !isPremium}
            className="chat-input"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !isPremium}
            className="chat-send-btn"
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="upgrade-modal-overlay" onClick={() => setShowUpgrade(false)}>
          <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowUpgrade(false)}>×</button>
            <div className="upgrade-modal-content">
              <div className="upgrade-icon">⭐</div>
              <h2>Unlock AI Style Coach</h2>
              <p className="upgrade-description">
                Get personalized fashion advice and alternative suggestions for your outfits
              </p>
              
              <div className="premium-features-list">
                <div className="feature-item-modal">
                  <span className="check-icon">✓</span>
                  <span>Unlimited AI chat conversations</span>
                </div>
                <div className="feature-item-modal">
                  <span className="check-icon">✓</span>
                  <span>Alternative suggestions for your wardrobe</span>
                </div>
                <div className="feature-item-modal">
                  <span className="check-icon">✓</span>
                  <span>Accessory and color recommendations</span>
                </div>
                <div className="feature-item-modal">
                  <span className="check-icon">✓</span>
                  <span>Budget-friendly style tips</span>
                </div>
                <div className="feature-item-modal">
                  <span className="check-icon">✓</span>
                  <span>Plus: Unlimited ratings & Roast Mode</span>
                </div>
              </div>

              <div className="upgrade-price">
                <span className="price-amount">$4.99</span>
                <span className="price-period">/month</span>
              </div>

              <button className="btn-upgrade-modal" onClick={() => alert('Payment integration coming soon!')}>
                Upgrade to Premium
              </button>
              
              <p className="upgrade-note">Cancel anytime. 7-day money-back guarantee.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PremiumStyleChat