import { supabase } from '../../supabaseClient'

const ADMIN_IDS = ['0ab8bd7c-f0db-4de6-abc9-ec44bb120830']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { payout_id } = req.body
  if (!payout_id) return res.status(400).json({ error: 'Missing payout_id' })

  // TODO: replace with real auth check
  // if (!ADMIN_IDS.includes(currentUserId)) return res.status(403).json({ error: 'Not authorized' })

  const { data: payout, error: payoutError } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('id', payout_id)
    .single()

  if (payoutError || !payout) return res.status(404).json({ error: 'Payout not found' })
  if (payout.status !== 'pending') return res.status(400).json({ error: 'Already processed' })

  const { data: rewards, error: rewardsError } = await supabase
    .from('user_rewards')
    .select('cashback_balance')
    .eq('user_id', payout.user_id)
    .single()

  if (rewardsError || !rewards) return res.status(400).json({ error: 'User rewards not found' })
  if (payout.amount > rewards.cashback_balance) {
    return res.status(400).json({ error: 'Insufficient cashback' })
  }

  const { error: updateRewardsError } = await supabase
    .from('user_rewards')
    .update({ cashback_balance: rewards.cashback_balance - payout.amount })
    .eq('user_id', payout.user_id)

  if (updateRewardsError) return res.status(500).json({ error: 'Failed to update rewards' })

  const { data: updated, error: updatePayoutError } = await supabase
    .from('payout_requests')
    .update({ status: 'approved' })
    .eq('id', payout_id)
    .select()
    .single()

  if (updatePayoutError) return res.status(500).json({ error: 'Failed to update payout' })
  return res.status(200).json({ success: true, payout: updated })
}
