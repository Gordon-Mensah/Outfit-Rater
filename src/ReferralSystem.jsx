// ReferralSystem.jsx - UPDATED WITH BETTER UX

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
  const [payoutLoading, setPayoutLoading] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
      console.warn("⏰ Referral page timeout")
    }, 6000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (user) {
      initializeReferral()
      loadReferralData()
    }
  }, [user])

  const initializeReferral = async () => {
    try {
      const { data } = await supabase
        .from('referral_links')
        .select('referral_code')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setReferralCode(data.referral_code)
        setReferralLink(`${window.location.origin}/signup?ref=${data.referral_code}`)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

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

      setStats({
        totalReferrals: linkRes.data?.total_referrals || 0,
        successfulConversions: linkRes.data?.successful_conversions || 0,
        freeMonthsEarned: rewardsRes.data?.free_months_balance || 0,
        cashbackEarned: rewardsRes.data?.cashback_balance || 0
      })

      setTransactions(transRes.data || [])
    } catch (error) {
      console.error('Error:', error)
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
      await navigator.share({ 
        title: 'Join AI Outfit Rater', 
        text: 'Get 20% off your first month!', 
        url: referralLink 
      })
    } else {
      copyLink()
    }
  }

  const requestPayout = async () => {
    if (!stats.cashbackEarned || stats.cashbackEarned < 10) {
      alert("Minimum payout is $10. Keep referring to reach the threshold!")
      return
    }

    setPayoutLoading(true)

    try {
      const res = await fetch("/api/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          amount: stats.cashbackEarned,
          payout_method: "paypal",
          payout_details: { paypal_email: user.email }
        })
      })

      const json = await res.json()

      if (json.success) {
        alert("✅ Payout request submitted! We'll process it within 3-5 business days.")
        loadReferralData()
      } else {
        alert(json.error || "Error submitting request.")
      }
    } catch (err) {
      console.error(err)
      alert("Error submitting payout request.")
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  return (
    <div className="referral-page">
      <div className="referral-container">
        <div className="referral-header-section">
          <button onClick={() => navigate('/rate')} className="back-button">← Back</button>
          <div className="header">
            <h1>💰 Referral Program</h1>
            <HamburgerMenu />
          </div>
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

        {stats.cashbackEarned > 0 && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={requestPayout}
              disabled={payoutLoading || stats.cashbackEarned < 10}
              style={{
                background: payoutLoading || stats.cashbackEarned < 10
                  ? '#666' 
                  : 'linear-gradient(90deg, #7F5AF0, #9B5DE5)',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: payoutLoading || stats.cashbackEarned < 10 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                opacity: payoutLoading || stats.cashbackEarned < 10 ? 0.6 : 1
              }}
            >
              {payoutLoading ? '⏳ Processing...' : '💸 Request Payout'}
            </button>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
              {stats.cashbackEarned < 10 
                ? `$${(10 - stats.cashbackEarned).toFixed(2)} away from minimum payout` 
                : 'Processed within 3-5 business days'}
            </p>
          </div>
        )}

        <div className="ref-link-card">
          <h2>Your Referral Link</h2>
          <p className="link-desc">Share with friends to earn rewards</p>
          <div className="code-badge-display">
            <span className="code-lbl">Code:</span>
            <span className="code-val">{referralCode}</span>
          </div>
          <div className="link-input-grp">
            <input value={referralLink} readOnly className="link-inp"/>
            <button onClick={copyLink} className="btn-copy">
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="share-btns">
            <button onClick={shareLink} className="btn-share-soc">📤 Share</button>
            <button onClick={copyLink} className="btn-share-soc sec">📋 Copy</button>
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
            <h3>👥 User Referral</h3>
            <div className="rew-item"><span>You:</span><span>1 Free Month</span></div>
            <div className="rew-item"><span>Friend:</span><span>20% Off</span></div>
          </div>
          <div className="reward-card inf">
            <h3>⭐ Influencer</h3>
            <div className="rew-item"><span>You:</span><span>30% Cashback</span></div>
            <div className="rew-item"><span>User:</span><span>FREE Month</span></div>
            <button 
              className="btn-inf" 
              onClick={() => window.location.href = 'mailto:outfitraterpartner@gmail.com?subject=Partnership'}
            >
              📧 Partner With Us
            </button>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="trans-card">
            <h2>Recent Referrals</h2>
            <div className="trans-list">
              {transactions.map(t => (
                <div key={t.id} className="trans-item">
                  <div className="trans-icon">{t.transaction_type === 'influencer' ? '⭐' : '🎁'}</div>
                  <div className="trans-det">
                    <div className="trans-type">
                      {t.transaction_type === 'influencer' ? 'Influencer' : 'User'} Referral
                    </div>
                    <div className="trans-date">{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="trans-rew">
                    {t.referrer_reward_type === 'free_month' ? (
                      <span className="rew-badge">+1 Month</span>
                    ) : (
                      <span className="rew-badge cash">+${t.referrer_reward_amount?.toFixed(2) || '0.00'}</span>
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