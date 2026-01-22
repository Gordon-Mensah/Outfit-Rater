// HamburgerMenu.jsx - Fixed logout functionality
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import SimpleUpgradeButton from './SimpleUpgradeButton'

function HamburgerMenu() {
  const { user, isPremium, dailyRatingCount, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
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
      document.body.classList.add('menu-open')
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.classList.remove('menu-open')
    }
  }, [isOpen])

  const handleLogout = async () => {
    if (isLoggingOut) return // Prevent double clicks
    
    setIsLoggingOut(true)
    
    try {
      // Clear all storage first
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from Supabase
      await signOut()
      
      // Force navigate to login page
      navigate('/login', { replace: true })
      
      // Small delay then reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, still redirect
      window.location.href = '/login'
    }
  }

  const getInitials = (email) => {
    if (!email) return '??'
    return email.substring(0, 2).toUpperCase()
  }

  const navigateAndClose = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
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
              <span className="menu-badge free">🆓 Free Tier · {dailyRatingCount}/5 today</span>
            )}
          </div>
        </div>

        <div className="menu-divider"></div>

        {/* Menu Items */}
        <nav className="menu-nav">
          <button 
            className={`menu-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigateAndClose('/')}
          >
            <span className="menu-item-text">Dashboard</span>
            <span className="menu-item-arrow">›</span>
          </button>

          <button 
            className={`menu-item ${isActive('/history') ? 'active' : ''}`}
            onClick={() => navigateAndClose('/history')}
          >
            <span className="menu-item-text">Rating History</span>
            <span className="menu-item-arrow">›</span>
          </button>

          <button 
            className={`menu-item ${isActive('/saved-outfits') ? 'active' : ''}`}
            onClick={() => navigateAndClose('/saved-outfits')}
          >
            <span className="menu-item-text">Saved Outfits</span>
            <span className="menu-item-arrow">›</span>
          </button>

          <button 
            className={`menu-item ${isActive('/wardrobe') ? 'active' : ''}`}
            onClick={() => navigateAndClose('/wardrobe')}
          >
            <span className="menu-item-text">Virtual Wardrobe</span>
            <span className="menu-item-arrow">›</span>
          </button>

          // Add this button somewhere in your menu
          <button onClick={() => navigate('/style-context')}>
            Style Context Settings
          </button>

          <button 
            className={`menu-item ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => navigateAndClose('/profile')}
          >
            <span className="menu-item-text">Profile Settings</span>
            <span className="menu-item-arrow">›</span>
          </button>

          <button 
            className={`menu-item ${isActive('/referrals') ? 'active' : ''}`}
            onClick={() => navigateAndClose('/referrals')}
          >
            <span className="menu-item-text">Referrals & Rewards</span>
            <span className="menu-item-arrow">›</span>
          </button>

          {!isPremium && (
            <>
              <div className="menu-divider"></div>
             <SimpleUpgradeButton 
                text="Upgrade to Premium"
                billingCycle="monthly"
                className="btn-upgrade-small"
              />
            </>
          )}

          <div className="menu-divider"></div>

          <button 
            className="menu-item logout-item"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <span className="menu-item-text">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
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