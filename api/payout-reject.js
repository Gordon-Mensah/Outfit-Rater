import { supabase } from '../../supabaseClient'

const ADMIN_IDS = ['0ab8bd7c-f0db-4de6-abc9-ec44bb120830']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { payout_id } = req.body
  if (!payout_id) return res.status(400).json({ error: 'Missing payout_id' })

  const { data, error } = await supabase
    .from('payout_requests')
    .update({ status: 'rejected' })
    .eq('id', payout_id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to reject payout' })
  return res.status(200).json({ success: true, payout: data })
}
