// api/stripe-webhook.js - Handle Stripe Webhook Events
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata.userId
        const purchaseAmount = session.amount_total / 100

        // 1. Upgrade user to premium
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            status: 'active',
            plan: 'premium',
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            updated_at: new Date().toISOString()
          })

        console.log('✅ User upgraded to premium:', userId)

        // 2. Influencer referral
        const { data: referral } = await supabase
          .from('referral_transactions')
          .select('*')
          .eq('referee_id', userId)
          .eq('transaction_type', 'influencer')
          .eq('status', 'pending')
          .single()

        if (referral) {
          console.log('🎉 Influencer referral detected:', referral.referrer_id)

          const cashbackAmount = purchaseAmount * 0.30

          await supabase.rpc('add_cashback', {
            user_id_input: referral.referrer_id,
            amount_input: cashbackAmount
          })

          await supabase
            .from('referral_transactions')
            .update({
              status: 'completed',
              referrer_reward_amount: cashbackAmount
            })
            .eq('id', referral.id)

          console.log(`💰 Cashback awarded: $${cashbackAmount} to influencer ${referral.referrer_id}`)
        }

        // ⭐ 3. USER REFERRAL LOGIC (correct placement)
        const { data: userReferral } = await supabase
          .from('referral_transactions')
          .select('*')
          .eq('referee_id', userId)
          .eq('transaction_type', 'user')
          .eq('status', 'pending')
          .single()

        if (userReferral) {
          console.log('👥 User referral detected:', userReferral.referrer_id)

          const freeMonthValue = purchaseAmount // or 5.99

          await supabase.rpc('add_cashback', {
            user_id_input: userReferral.referrer_id,
            amount_input: freeMonthValue
          })

          await supabase
            .from('referral_transactions')
            .update({
              status: 'completed',
              referrer_reward_amount: freeMonthValue
            })
            .eq('id', userReferral.id)

          console.log(`🎁 Free month reward applied to referrer ${userReferral.referrer_id}`)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          const status = subscription.status === 'active' ? 'premium' : 'free'
          
          await supabase
            .from('subscriptions')
            .update({
              status,
              plan: status,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', sub.user_id)

          console.log('✅ Subscription updated:', sub.user_id, status)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'free',
              plan: 'free',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', sub.user_id)

          console.log('✅ Subscription canceled:', sub.user_id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          console.log('⚠️ Payment failed for user:', sub.user_id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}
