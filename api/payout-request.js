import { supabase } from '../../supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id, amount, payout_method, payout_details } = req.body
  if (!user_id || !amount) return res.status(400).json({ error: 'Missing fields' })

  const { data: rewards, error: rewardsError } = await supabase
    .from('user_rewards')
    .select('cashback_balance')
    .eq('user_id', user_id)
    .single()

  if (rewardsError || !rewards) return res.status(400).json({ error: 'Rewards not found' })
  if (amount > rewards.cashback_balance) return res.status(400).json({ error: 'Not enough cashback' })

  const { data, error } = await supabase
    .from('payout_requests')
    .insert({
      user_id,
      amount,
      payout_method,
      payout_details
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to create payout request' })
  return res.status(200).json({ success: true, payout: data })
}
