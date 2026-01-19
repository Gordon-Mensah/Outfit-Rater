import { useState } from 'react'
import { supabase } from './supabaseClient'

function PromoCodeInput({ onCodeApplied }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const validateCode = async () => {
    if (!code.trim()) return
    setLoading(true)
    setMessage(null)

    try {
      // Check promo codes
      const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single()
      if (promo) {
        onCodeApplied({ type: 'influencer', code: promo.code, discount: 'free' })
        setMessage({ type: 'success', text: '🎉First month FREE!' })
        return
      }

      // Check referral codes
      const { data: ref } = await supabase.from('referral_links').select('user_id, referral_code').eq('referral_code', code.toUpperCase()).single()
      if (ref) {
        onCodeApplied({ type: 'user', code: ref.referral_code, discount: '20_off', referrerId: ref.user_id })
        setMessage({ type: 'success', text: '✓ 20% off first month!' })
        return
      }

      setMessage({ type: 'error', text: 'Invalid code' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error validating code' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="promo-section">
      <label className="promo-lbl">Have a promo or referral code?</label>
      <div className="promo-grp">
        <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" className="promo-inp" disabled={loading}/>
        <button onClick={validateCode} disabled={loading || !code} className="promo-btn">{loading ? 'Checking...' : 'Apply'}</button>
      </div>
      {message && <div className={`promo-msg ${message.type}`}>{message.text}</div>}
    </div>
  )
}

export default PromoCodeInput