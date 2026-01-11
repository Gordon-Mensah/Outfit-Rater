// HamburgerMenu.jsx - Beautiful slide-in hamburger menu
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function HamburgerMenu() {
  const { user, isPremium, dailyRatingCount, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden' // Prevent scrolling when menu is open
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = async () => {
    localStorage.clear()
    sessionStorage.clear()
    await signOut()
    window.location.reload()
  }

  const getInitials = (email) => {
    if (!email) return '??'
    return email.substring(0, 2).toUpperCase()
  }

  const navigateAndClose = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button 
        className="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Overlay */}
      {isOpen && <div className="menu-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Slide-in Menu */}
      <div ref={menuRef} className={`hamburger-menu ${isOpen ? 'open' : ''}`}>
        {/* User Profile Header */}
        <div className="menu-header">
          <div className="menu-avatar">
            {getInitials(user?.email)}
          </div>
          <div className="menu-user-info">
            <h3 className="menu-user-name">Welcome back!</h3>
            <p className="menu-user-email">{user?.email}</p>
            {isPremium ? (
              <span className="menu-badge premium">⭐ Premium Member</span>
            ) : (
              <span className="menu-badge free">🆓 Free Tier · {dailyRatingCount}/3 today</span>
            )}
          </div>
        </div>

        <div className="menu-divider"></div>

        {/* Menu Items */}
        <nav className="menu-nav">
          <button 
            className="menu-item"
            onClick={() => navigateAndClose('/')}
          >
            <span className="menu-item-icon">🏠</span>
            <span className="menu-item-text">Dashboard</span>
            <span className="menu-item-arrow">›</span>
          </button>

          <button 
            className="menu-item"
            onClick={() => navigateAndClose('/profile')}
          >
            <span className="menu-item-icon">👤</span>
            <span className="menu-item-text">Profile Settings</span>
            <span className="menu-item-arrow">›</span>
          </button>

          <button 
            className="menu-item"
            onClick={() => {
              // TODO: Add saved outfits navigation
              setIsOpen(false)
            }}
          >
            <span className="menu-item-icon">💾</span>
            <span className="menu-item-text">Saved Outfits</span>
            <span className="menu-item-badge">{dailyRatingCount}</span>
          </button>

          <button 
            className="menu-item"
            onClick={() => {
              // TODO: Add history navigation
              setIsOpen(false)
            }}
          >
            <span className="menu-item-icon">📊</span>
            <span className="menu-item-text">Rating History</span>
            <span className="menu-item-arrow">›</span>
          </button>

          {!isPremium && (
            <>
              <div className="menu-divider"></div>
              <button 
                className="menu-item upgrade-item"
                onClick={() => {
                  alert('Premium coming soon! Only $4.99/month')
                  setIsOpen(false)
                }}
              >
                <span className="menu-item-icon">⭐</span>
                <span className="menu-item-text">Upgrade to Premium</span>
                <span className="upgrade-tag">New</span>
              </button>
            </>
          )}

          <div className="menu-divider"></div>

          <button 
            className="menu-item logout-item"
            onClick={handleLogout}
          >
            <span className="menu-item-icon">🚪</span>
            <span className="menu-item-text">Logout</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="menu-footer">
          <p className="menu-footer-text">AI Outfit Rater</p>
          <p className="menu-footer-version">Version 1.0.0</p>
        </div>
      </div>
    </>
  )
}

export default HamburgerMenu