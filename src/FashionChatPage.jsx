// FashionChatPage.jsx - Dedicated AI Fashion Chat
import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Groq from 'groq-sdk'

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true 
})

function FashionChatPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const outfitData = location.state?.outfitData

  // Redirect non-premium users
  useEffect(() => {
    if (!isPremium) {
      alert('⭐ This is a premium feature. Please upgrade to access AI chat.')
      navigate('/')
    }
  }, [isPremium, navigate])

  // Initialize chat with context about the outfit
  useEffect(() => {
    if (outfitData) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your AI style assistant. I can see you just rated an outfit (${outfitData.rating}/10 for ${outfitData.occasion}). I'm here to help with:\n\n• Alternative outfit suggestions\n• Color combinations\n• Accessory recommendations\n• Style tips for any occasion\n\nWhat would you like to know?`
        }
      ])
    } else {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your AI style assistant. I can help you with:\n\n• Outfit recommendations\n• Color matching\n• Style advice\n• Fashion trends\n• Accessory suggestions\n\nWhat can I help you with today?`
        }
      ])
    }
  }, [outfitData])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Add system prompt for fashion context
      const systemPrompt = {
        role: 'system',
        content: `You are a professional fashion stylist and AI style assistant. You provide helpful, trendy, and personalized fashion advice. Keep responses concise (2-3 paragraphs max). Focus on practical, actionable fashion tips. Be friendly and encouraging. Only discuss fashion, style, clothing, accessories, and appearance-related topics. If asked about other topics, politely redirect to fashion.`
      }

      // Call Groq API
      const completion = await groq.chat.completions.create({
        messages: [
          systemPrompt,
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 500
      })

      const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I encountered an error. Please try again.'

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
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

  const quickPrompts = [
    "What colors go well with this?",
    "Suggest alternative outfits",
    "How can I accessorize this?",
    "What shoes should I wear?",
    "Give me style tips"
  ]

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>✨ AI Style Assistant</h1>
          <span style={styles.premiumBadge}>⭐ Premium</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            style={{
              ...styles.messageWrapper,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div 
              style={{
                ...styles.message,
                ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage)
              }}
            >
              {msg.role === 'assistant' && <span style={styles.avatar}>🤖</span>}
              <p style={styles.messageText}>{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={styles.messageWrapper}>
            <div style={{...styles.message, ...styles.assistantMessage}}>
              <span style={styles.avatar}>🤖</span>
              <div style={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && (
        <div style={styles.quickPromptsContainer}>
          <p style={styles.quickPromptsTitle}>Quick questions:</p>
          <div style={styles.quickPrompts}>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInput(prompt)}
                style={styles.quickPromptButton}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about fashion..."
          style={styles.input}
          rows={2}
          disabled={loading}
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !input.trim()}
          style={{
            ...styles.sendButton,
            ...(loading || !input.trim() ? styles.sendButtonDisabled : {})
          }}
        >
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0f0f0f',
    color: 'white'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #333',
    backgroundColor: '#1a1a1a'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  premiumBadge: {
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: '#667eea',
    borderRadius: '12px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  messageWrapper: {
    display: 'flex',
    width: '100%'
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '16px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start'
  },
  userMessage: {
    backgroundColor: '#667eea',
    marginLeft: 'auto'
  },
  assistantMessage: {
    backgroundColor: '#2a2a2a'
  },
  avatar: {
    fontSize: '20px',
    flexShrink: 0
  },
  messageText: {
    margin: 0,
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap'
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '4px'
  },
  quickPromptsContainer: {
    padding: '16px 20px',
    borderTop: '1px solid #333'
  },
  quickPromptsTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#888'
  },
  quickPrompts: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  quickPromptButton: {
    padding: '8px 12px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  inputContainer: {
    padding: '20px',
    borderTop: '1px solid #333',
    display: 'flex',
    gap: '12px',
    backgroundColor: '#1a1a1a'
  },
  input: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    fontFamily: 'inherit',
    resize: 'none'
  },
  sendButton: {
    width: '50px',
    height: '50px',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '12px',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
}

export default FashionChatPage