// server.js
// Express server that handles both API routes and serves the React frontend

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize services
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

// CRITICAL: Webhook route MUST come BEFORE express.json() middleware
// Stripe webhooks need raw body for signature verification
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('🔔 Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId || session.client_reference_id;

        console.log(`✅ Payment successful for user ${userId}`);

        // Update user's subscription to premium using the user_id column
        const { data, error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'active',
            plan: 'premium',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription
          })
          .eq('user_id', userId)
          .select();

        if (error) {
          console.error('❌ Error updating subscription:', error);
          // If record doesn't exist, insert it
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({ 
              user_id: userId,
              status: 'active',
              plan: 'premium',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription
            });
          
          if (insertError) {
            console.error('❌ Error inserting subscription:', insertError);
          } else {
            console.log(`🎉 Created new premium subscription for user ${userId}`);
          }
        } else {
          console.log(`🎉 User ${userId} upgraded to premium`, data);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const status = subscription.status === 'active' ? 'active' : 'inactive';

        console.log(`🔄 Subscription updated: ${subscription.id} - ${status}`);

        // Find user by customer ID stored in metadata
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata?.userId;

        if (userId) {
          await supabase
            .from('subscriptions')
            .update({ 
              status: status,
              plan: status === 'active' ? 'premium' : 'free'
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        console.log(`❌ Subscription cancelled: ${subscription.id}`);

        // Find user by customer ID stored in metadata
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userId = customer.metadata?.userId;

        if (userId) {
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'cancelled',
              plan: 'free'
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`💰 Payment succeeded: ${invoice.id}`);
        // Subscription is already active, just log
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`⚠️ Payment failed: ${invoice.id}`);
        
        // Find user and update to past_due
        const customer = await stripe.customers.retrieve(invoice.customer);
        const userId = customer.metadata?.userId;

        if (userId) {
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'past_due'
            })
            .eq('user_id', userId);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Regular middleware (AFTER webhook route)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes

// ⭐ NEW: Ping endpoint to keep Render service alive
app.get('/api/ping', (req, res) => {
  console.log('🏓 Ping received at:', new Date().toISOString());
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is alive'
  });
});

// 1. Rate Outfit Endpoint
app.post('/api/rate-outfit', async (req, res) => {
  try {
    const { image, occasion, mode, userId } = req.body;

    if (!image || !occasion || !mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`🤖 Rating outfit for user ${userId} - ${occasion} - ${mode} mode`);

    const prompts = {
      helpful: `You are a supportive fashion advisor. Analyze this outfit for a ${occasion} occasion. Give a rating from 1-10 and provide encouraging, constructive feedback focusing on what works well and gentle suggestions for improvement.`,
      honest: `You are a direct, honest fashion critic. Analyze this outfit for a ${occasion} occasion. Give a rating from 1-10 and provide straightforward, no-nonsense feedback about what works and what doesn't.`,
      roast: `You are a playful, witty fashion roaster. Analyze this outfit for a ${occasion} occasion. Give a rating from 1-10 and provide humorous, clever roast-style commentary. Be funny but not mean-spirited.`
    };

    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompts[mode] },
          { type: 'image_url', image_url: { url: image } }
        ]
      }],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content || '';
    const ratingMatch = response.match(/(\d+)\/10|rating[:\s]+(\d+)|score[:\s]+(\d+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3]) : 7;

    console.log(`✅ Rating complete: ${rating}/10`);

    res.json({
      rating: Math.min(Math.max(rating, 1), 10),
      feedback: response
    });
  } catch (error) {
    console.error('❌ Rate Outfit Error:', error);
    res.status(500).json({ error: 'Failed to analyze outfit', details: error.message });
  }
});

// 2. Compare Outfits Endpoint
app.post('/api/compare-outfits', async (req, res) => {
  try {
    const { images, occasion, userId } = req.body;

    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 images to compare' });
    }

    console.log(`🔄 Comparing ${images.length} outfits for user ${userId} - ${occasion}`);

    const content = [
      {
        type: 'text',
        text: `Compare these ${images.length} outfits for a ${occasion} occasion. For each outfit, give a rating from 1-10. Then identify which outfit is best overall and explain why. Finally, suggest creative ways to mix and match elements from different outfits.`
      },
      ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
    ];

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: content }],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      max_tokens: 800
    });

    const response = completion.choices[0]?.message?.content || '';
    const ratingMatches = response.match(/\d+\/10/g) || [];
    const ratings = ratingMatches.map(match => parseInt(match)).slice(0, images.length);
    
    while (ratings.length < images.length) {
      ratings.push(7);
    }

    const bestIndex = ratings.indexOf(Math.max(...ratings));

    console.log(`✅ Comparison complete. Best: Outfit ${bestIndex + 1} (${ratings[bestIndex]}/10)`);

    res.json({
      ratings,
      bestIndex,
      analysis: response,
      mixSuggestion: response.includes('mix') ? response : 'Try combining elements from your top-rated outfits!'
    });
  } catch (error) {
    console.error('❌ Compare Outfits Error:', error);
    res.status(500).json({ error: 'Failed to compare outfits', details: error.message });
  }
});

// 2.5 Analyze Product Endpoint
app.post('/api/analyze-product', async (req, res) => {
  try {
    const { image, title, description } = req.body;

    if (!image || !title) {
      return res.status(400).json({ error: 'Missing required fields: image or title' });
    }

    console.log(`🛍️ Analyzing product: ${title}`);

    const prompt = `
You are a professional product analyst and e‑commerce conversion expert.
Analyze the product based on the image and the provided details.

Provide:
1. A clear summary of what the product is.
2. The target audience.
3. Strengths of the product.
4. Weaknesses or concerns.
5. Suggested improvements.
6. A conversion‑optimized product description (SEO friendly).
7. A rating from 1–10 for:
  - Marketability
  - Aesthetic appeal
  - Perceived quality
  - Viral potential
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "text", text: `Product Title: ${title}` },
            { type: "text", text: `Product Description: ${description || "No description provided"}` },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.7,
      max_tokens: 800
    });

    const aiResponse = completion.choices?.[0]?.message?.content || "No response generated";

    res.json({
      success: true,
      analysis: aiResponse
    });

  } catch (error) {
    console.error("❌ Product analysis error:", error);
    res.status(500).json({ error: "Failed to analyze product" });
  }
});

// 3. Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, userEmail, plan, billingCycle } = req.body;

    console.log('📝 Creating checkout session for:', { userId, userEmail, plan, billingCycle });

    if (!userId || !plan || !billingCycle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const priceIds = {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_YEARLY
    };

    if (!priceIds[billingCycle]) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    let email = userEmail;
    if (!email) {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      email = user.email;
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceIds[billingCycle], quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'https://outfitrater.xyz'}/?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://outfitrater.xyz'}/?canceled=true`,
      metadata: { userId, plan, billingCycle },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: { 
        metadata: { userId, plan, billingCycle } 
      }
    });

    console.log(`💳 Checkout session created: ${session.id} for user ${userId}`);

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('❌ Stripe Checkout error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 4. Create Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get user's subscription to find their Stripe customer ID
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // For now, return error since we don't have customer_id stored
    // You'll need to store stripe_customer_id to use the portal
    return res.status(400).json({ 
      error: 'Customer portal not available. Please contact support.' 
    });

  } catch (error) {
    console.error('❌ Portal session error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
  console.log(`🔔 Webhook endpoint: /api/stripe-webhook`);
  console.log(`🏓 Ping endpoint: /api/ping`); // ⭐ NEW
});