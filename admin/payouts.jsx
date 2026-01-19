import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

function AdminPayouts() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const ADMIN_IDS = ['YOUR_ADMIN_USER_ID_HERE'] // replace with your id(s)

  useEffect(() => {
    if (!user) return
    if (!ADMIN_IDS.includes(user.id)) return
    loadPayouts()
  }, [user])

  const loadPayouts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setRequests(data || [])
    setLoading(false)
  }

  const callAction = async (endpoint, payout_id) => {
    const res = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id })
    })
    const json = await res.json()
    if (!res.ok) alert(json.error || 'Action failed')
    await loadPayouts()
  }

  if (!user || !ADMIN_IDS.includes(user.id)) {
    return <div style={{ padding: 24 }}>Not authorized.</div>
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div className="admin-payouts-page">
      <h1>Payout Requests</h1>
      {requests.length === 0 && <p>No payout requests yet.</p>}
      <div className="payout-list">
        {requests.map(r => (
          <div key={r.id} className="payout-item">
            <div>User: {r.user_id}</div>
            <div>Amount: ${Number(r.amount).toFixed(2)}</div>
            <div>Status: {r.status}</div>
            <div>Method: {r.payout_method}</div>
            <div>Requested: {new Date(r.created_at).toLocaleString()}</div>
            {r.paid_at && <div>Paid: {new Date(r.paid_at).toLocaleString()}</div>}
            <div className="payout-actions">
              {r.status === 'pending' && (
                <>
                  <button onClick={() => callAction('payout-approve', r.id)}>Approve</button>
                  <button onClick={() => callAction('payout-reject', r.id)}>Reject</button>
                </>
              )}
              {r.status === 'approved' && (
                <button onClick={() => callAction('payout-paid', r.id)}>Mark Paid</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPayouts
