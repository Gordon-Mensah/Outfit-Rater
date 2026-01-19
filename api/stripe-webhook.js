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
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata.userId
        const purchaseAmount = session.amount_total / 100 // Stripe sends cents

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

        // 2. Check if this user was referred by an influencer
        const { data: referral } = await supabase
          .from('referral_transactions')
          .select('*')
          .eq('referee_id', userId)
          .eq('transaction_type', 'influencer')
          .eq('status', 'pending')
          .single()

        if (referral) {
          console.log('🎉 Influencer referral detected:', referral.referrer_id)

          // 3. Award 30% cashback to influencer
          const cashbackAmount = purchaseAmount * 0.30

          await supabase.rpc('add_cashback', {
            user_id_input: referral.referrer_id,
            amount_input: cashbackAmount
          })

          // 4. Mark referral as completed
          await supabase
            .from('referral_transactions')
            .update({
              status: 'completed',
              referrer_reward_amount: cashbackAmount
            })
            .eq('id', referral.id)

          console.log(`💰 Cashback awarded: $${cashbackAmount} to influencer ${referral.referrer_id}`)
        }

        break
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert({ ... }, { onConflict: ['user_id'] })

      if (error) {
        console.error("❌ Supabase upsert failed:", error)
      } else {
        console.log("✅ Supabase row written for:", userId)
      }


      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Get user ID from customer
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          // Update subscription status
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

        // Get user ID from customer
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          // Downgrade to free
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

        // Get user ID from customer
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          // Optionally send email notification or handle failed payment
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