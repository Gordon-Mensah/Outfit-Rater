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

        // Update subscription to premium
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan: 'premium',
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        console.log('✅ User upgraded to premium:', userId)
        break
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