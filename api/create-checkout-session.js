// api/create-checkout-session.js
// Serverless function to create Stripe checkout session

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userEmail, plan, billingCycle } = req.body;

    // Validate input
    if (!userId || !plan || !billingCycle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Define price IDs from environment variables
    const priceIds = {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_YEARLY
    };

    // Validate price ID exists
    if (!priceIds[billingCycle]) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Get user email from Supabase if not provided
    let email = userEmail;
    if (!email) {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      email = user.email;
    }

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId
        }
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceIds[billingCycle],
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        plan: plan,
        billingCycle: billingCycle
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          userId: userId
        }
      }
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe Checkout error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}