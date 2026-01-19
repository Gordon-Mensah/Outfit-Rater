import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'
import HamburgerMenu from './Hamburgermenu'

function ReferralSystem() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [stats, setStats] = useState({
    totalReferrals: 0,
    successfulConversions: 0,
    freeMonthsEarned: 0,
    cashbackEarned: 0
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // ⏳ Prevent infinite loading if Supabase hangs
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
      console.warn("⏰ Referral page timeout fallback triggered")
    }, 6000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (user) {
      initializeReferral()
      loadReferralData()
    }
  }, [user])

  // ⭐ Load permanent referral code (no generation here)
  const initializeReferral = async () => {
    try {
      const { data: existing } = await supabase
        .from('referral_links')
        .select('referral_code')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        setReferralCode(existing.referral_code)
        setReferralLink(`${window.location.origin}/signup?ref=${existing.referral_code}`)
      } else {
        console.error("❌ No referral code found for user — this should never happen now.")
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // ⚡ Load referral stats, rewards, and transactions
  const loadReferralData = async () => {
    try {
      const [linkRes, rewardsRes, transRes] = await Promise.all([
        supabase.from('referral_links').select('*').eq('user_id', user.id).single(),
        supabase.from('user_rewards').select('*').eq('user_id', user.id).single(),
        supabase.from('referral_transactions')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      const linkData = linkRes.data
      const rewardsData = rewardsRes.data
      const transData = transRes.data

      setStats({
        totalReferrals: linkData?.total_referrals || 0,
        successfulConversions: linkData?.successful_conversions || 0,
        freeMonthsEarned: rewardsData?.free_months_balance || 0,
        cashbackEarned: rewardsData?.cashback_balance || 0
      })

      setTransactions(transData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join AI Outfit Rater', text: 'Get 20% off!', url: referralLink })
    } else {
      copyLink()
    }
  }

  // ⭐ NEW — Request payout function
  const requestPayout = async () => {
    try {
      if (!stats.cashbackEarned || stats.cashbackEarned <= 0) {
        alert("You have no cashback to withdraw.")
        return
      }

      const amount = stats.cashbackEarned // full balance
      const payout_method = "paypal"
      const payout_details = { paypal_email: user.email }

      const res = await fetch("/api/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          amount,
          payout_method,
          payout_details
        })
      })

      const json = await res.json()

      if (json.success) {
        alert("Payout request submitted!")
      } else {
        alert(json.error || "Something went wrong.")
      }
    } catch (err) {
      console.error(err)
      alert("Error submitting payout request.")
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div className="referral-page">
      <div className="referral-container">
        <div className="referral-header-section">
          <button onClick={() => navigate('/')} className="back-button">← Back</button>
          <div className="header"><h1> Referral Program</h1><HamburgerMenu /></div>
          <p className="subtitle">Earn rewards by inviting friends!</p>
        </div>

        <div className="referral-stats-grid">
          <div className="ref-stat-card">
            <div className="stat-val-lg">{stats.totalReferrals}</div>
            <div className="stat-lbl-lg">Total Referrals</div>
          </div>
          <div className="ref-stat-card">
            <div className="stat-val-lg">{stats.successfulConversions}</div>
            <div className="stat-lbl-lg">Conversions</div>
          </div>
          <div className="ref-stat-card premium">
            <div className="stat-val-lg">{stats.freeMonthsEarned}</div>
            <div className="stat-lbl-lg">Free Months</div>
          </div>
          <div className="ref-stat-card cash">
            <div className="stat-val-lg">${stats.cashbackEarned.toFixed(2)}</div>
            <div className="stat-lbl-lg">Cashback</div>
          </div>
        </div>

        {/* ⭐ NEW — Request Payout Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button 
            onClick={requestPayout} 
            className="btn-share-soc"
            style={{ padding: "12px 20px", fontSize: "16px" }}
          >
            Request Payout
          </button>
        </div>

        <div className="ref-link-card">
          <h2>Your Referral Link</h2>
          <p className="link-desc">Share with friends to earn rewards</p>
          <div className="code-badge-display">
            <span className="code-lbl">Your Code:</span>
            <span className="code-val">{referralCode}</span>
          </div>
          <div className="link-input-grp">
            <input value={referralLink} readOnly className="link-inp"/>
            <button onClick={copyLink} className="btn-copy">
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="share-btns">
            <button onClick={shareLink} className="btn-share-soc">Share</button>
            <button onClick={copyLink} className="btn-share-soc sec">Copy</button>
          </div>
        </div>

        <div className="how-works-card">
          <h2>How It Works</h2>
          <div className="steps-grd">
            <div className="step-crd"><div className="step-num">1</div><h3>Share Link</h3><p>Send to friends</p></div>
            <div className="step-crd"><div className="step-num">2</div><h3>Friend Signs Up</h3><p>Gets 20% off</p></div>
            <div className="step-crd"><div className="step-num">3</div><h3>You Get Rewarded</h3><p>1 free month</p></div>
          </div>
        </div>

        <div className="rewards-grid">
          <div className="reward-card user">
            <h3>User Referral</h3>
            <div className="rew-item">
              <span>You:</span>
              <span>1 Free Month</span>    
            </div>
            <div className="rew-item">
              <span>Friend:</span>
              <span>20% Off</span>
            </div>
          </div>
          <div className="reward-card inf">
            <h3>Influencer Code</h3>
            <div className="rew-item">
              <span>Influencer:</span>
              <span>30% Cashback</span>
            </div>
            <div className="rew-item">
              <span>User:</span>
              <span>First Month FREE</span>
            </div>
            <button className="btn-inf" onClick={() => alert('Email: outfitraterpartner@gmail.com')}>
              Become Partner
            </button>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="trans-card">
            <h2>Recent Referrals</h2>
            <div className="trans-list">
              {transactions.map(t => (
                <div key={t.id} className="trans-item">
                  <div className="trans-icon">
                    {t.transaction_type === 'influencer' ? '⭐' : '🎁'}
                  </div>
                  <div className="trans-det">
                    <div className="trans-type">
                      {t.transaction_type === 'influencer' ? 'Influencer' : 'User'} Referral
                    </div>
                    <div className="trans-date">
                      {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="trans-rew">
                    {t.referrer_reward_type === 'free_month' ? (
                      <span className="rew-badge">+1 Month</span>
                    ) : (
                      <span className="rew-badge cash">+${t.referrer_reward_amount}</span>
                    )}
                  </div>
                  <div className={`trans-status ${t.status}`}>{t.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReferralSystem
