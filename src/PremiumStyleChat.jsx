// PremiumStyleChat.jsx - Simplified with Direct Checkout Button
import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import SimpleUpgradeButton from './SimpleUpgradeButton'

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000'

function PremiumStyleChat({ originalRating, originalFeedback, occasion, outfitImage }) {
  const { isPremium } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize with AI greeting
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Hi! I'm your AI style assistant. I can help you with alternative suggestions, color combinations, accessory recommendations, or any questions about your outfit. What would you like to know?`,
        timestamp: new Date()
      }
    ])
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

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
          originalRating,
          originalFeedback,
          occasion,
          conversationHistory: messages
        })
      })

      const data = await response.json()

      if (data.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = (question) => {
    setInput(question)
  }

  const quickQuestions = [
    "I don't have that color, suggest alternatives",
    "What shoes should I wear?",
    "Any budget-friendly alternatives?",
    "How can I accessorize this?"
  ]

  return (
    <div className={`premium-style-chat ${!isPremium ? 'locked' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">✨</div>
          <div className="chat-title-section">
            <h3>AI Style Assistant</h3>
            <p className="chat-status">
              {isPremium ? (
                <><span className="status-dot active"></span> Premium Active</>
              ) : (
                <><span className="status-dot locked"></span> Premium Feature</>
              )}
            </p>
          </div>
        </div>
        {isPremium && (
          <div className="premium-badge-chat">
            <span>⭐ Premium</span>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="chat-messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '✨'}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {msg.content}
              </div>
              <div className="message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="chat-message ai-message">
            <div className="message-avatar">✨</div>
            <div className="message-content">
              <div className="message-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="quick-questions">
        {quickQuestions.map((question, index) => (
          <button
            key={index}
            className="quick-question-btn"
            onClick={() => handleQuickQuestion(question)}
            disabled={loading || !isPremium}
          >
            {question}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder={isPremium ? "Ask me anything about your outfit..." : "🔒 Upgrade to Premium to chat"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading || !isPremium}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim() || !isPremium}
        >
          {loading ? (
            <span className="btn-spinner-chat"></span>
          ) : (
            <span>→</span>
          )}
        </button>
      </div>

      {/* Locked Overlay - SIMPLIFIED */}
      {!isPremium && (
        <div className="chat-locked-overlay">
          <div className="locked-content-simple">
            <div className="locked-icon">🔒</div>
            <h3>Premium Feature</h3>
            <p>Get personalized fashion advice from your AI style assistant</p>
            
            {/* SIMPLE BUTTON - NO MODAL */}
            <SimpleUpgradeButton 
              text="Upgrade to Premium - $5.99/month"
              className="btn-upgrade-simple"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PremiumStyleChat