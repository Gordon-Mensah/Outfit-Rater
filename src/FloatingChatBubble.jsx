// FloatingChatBubble.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './FloatingChatBubble.css'

function FloatingChatBubble({ outfitData }) {
  const navigate = useNavigate()
  const { isPremium } = useAuth()

  const handleClick = () => {
    if (!isPremium) {
      alert('⭐ Premium feature! Upgrade to chat with our AI style assistant.')
      return
    }

    // Navigate to chat page with outfit data
    navigate('/fashion-chat', { 
      state: { 
        outfitData: outfitData 
      } 
    })
  }

  return (
    <button 
      className={`floating-chat-bubble ${isPremium ? 'premium' : 'locked'}`}
      onClick={handleClick}
      title={isPremium ? 'Chat with AI Style Assistant' : 'Premium Feature - Upgrade to unlock'}
    >
      {isPremium ? (
        <>
          <span className="chat-icon">💬</span>
          <span className="chat-text">AI Chat</span>
        </>
      ) : (
        <>
          <span className="chat-icon">🔒</span>
          <span className="chat-text">Premium</span>
        </>
      )}
      
      {isPremium && (
        <span className="pulse-ring"></span>
      )}
    </button>
  )
}

export default FloatingChatBubble