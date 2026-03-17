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

    console.log('Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId || session.client_reference_id;

        console.log(`Payment successful for user ${userId}`);

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
          console.error('Error updating subscription:', error);
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
            console.error('Error inserting subscription:', insertError);
          } else {
            console.log(`Created new premium subscription for user ${userId}`);
          }
        } else {
          console.log(`User ${userId} upgraded to premium`, data);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const status = subscription.status === 'active' ? 'active' : 'inactive';

        console.log(`Subscription updated: ${subscription.id} - ${status}`);

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

        console.log(`Subscription cancelled: ${subscription.id}`);

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
        console.log(`Payment succeeded: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed: ${invoice.id}`);

        const customer = await stripe.customers.retrieve(invoice.customer);
        const userId = customer.metadata?.userId;

        if (userId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('user_id', userId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Regular middleware (AFTER webhook route)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Content Security Policy
// - Google Fonts allowed in style-src and font-src
// - Weather APIs and Nominatim allowed in connect-src
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.anthropic.com https://*.supabase.co wss://*.supabase.co https://js.stripe.com https://r.stripe.com https://api.stripe.com https://outfitrater.xyz https://*.outfitrater.xyz https://api.openweathermap.org https://api.open-meteo.com https://maps.googleapis.com https://nominatim.openstreetmap.org",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:"
    ].join('; ')
  );
  next();
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

// Ping endpoint to keep Render service alive
app.get('/api/ping', (req, res) => {
  console.log('Ping received at:', new Date().toISOString());
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is alive'
  });
});

// Geocoding proxy — OpenStreetMap Nominatim (free, no API key needed)
app.get('/api/geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing lat or lng query parameters' });
    }

    console.log(`Geocoding request: ${lat}, ${lng}`);

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'OutfitRater/1.0 (outfitrater.xyz)' }
    });
    const data = await response.json();

    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county;

    if (!city) {
      console.log('No city found in geocoding response');
      return res.json({ status: 'ZERO_RESULTS', results: [] });
    }

    console.log(`Geocoding result: ${city}`);

    res.json({
      status: 'OK',
      results: [
        {
          address_components: [
            { long_name: city, types: ['locality'] }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Geocoding proxy error:', error);
    res.status(500).json({ error: 'Geocoding request failed', details: error.message });
  }
});

// AI Stylist: Analyze user's photo
app.post('/api/analyze-style-photo', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Missing image' });
    }

    console.log('Analyzing style photo...');

    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a professional personal stylist. Analyze this person's photo and provide a concise style profile in 2-3 sentences covering:
- Their skin tone (warm/cool/neutral undertones)
- Their body proportions or silhouette type
- Any visible style preferences or aesthetic you can infer

Keep it positive, constructive, and focused on what clothing styles, colors, and fits would look best on them. Do not mention any personal identifiers. Be specific and actionable.`
          },
          {
            type: 'image_url',
            image_url: { url: image }
          }
        ]
      }],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.6,
      max_tokens: 300
    });

    const analysis = completion.choices[0]?.message?.content || '';
    console.log('Style photo analyzed');

    res.json({ analysis });
  } catch (error) {
    console.error('Style photo analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze photo', details: error.message });
  }
});

// AI Stylist: Generate personalized outfit combinations
app.post('/api/generate-styled-outfits', async (req, res) => {
  try {
    const { wardrobeSummary, stylistAnalysis, weather } = req.body;

    if (!wardrobeSummary || !Array.isArray(wardrobeSummary)) {
      return res.status(400).json({ error: 'Missing wardrobeSummary' });
    }

    console.log('Generating personalized outfit combinations...');

    const wardrobeText = wardrobeSummary
      .map(({ category, items }) =>
        `${category.toUpperCase()}:\n${items
          .map(i =>
            `  - ID: ${i.id} | Name: ${i.name} | Color: ${i.color || 'unknown'} | Type: ${i.subcategory || 'general'}`
          )
          .join('\n')}`
      )
      .join('\n\n');

    const prompt = `You are a professional stylist. Based on the following wardrobe and style profile, create 5 complete outfit combinations.

PERSON'S STYLE PROFILE:
${stylistAnalysis || 'No style profile provided — create generally flattering combinations.'}

${weather ? `WEATHER: ${weather}` : ''}

AVAILABLE WARDROBE ITEMS:
${wardrobeText}

Create 5 outfit combinations. For each outfit, respond ONLY with a JSON array (no markdown, no explanation) in this exact format:
[
  {
    "occasion": "Casual",
    "topId": "item-id-here",
    "bottomId": "item-id-here",
    "shoesId": "item-id-here",
    "outerwearId": null,
    "accessoryId": null,
    "layer2Id": null,
    "styleNote": "Why this outfit works for this person specifically",
    "colorStory": "How the colors work together",
    "layeringNote": "Layering tip if applicable, otherwise null"
  }
]

Rules:
- Only use item IDs that exist in the wardrobe above
- If a category has no items, set that field to null
- layer2Id is for a second top layer (e.g. hoodie under jacket, shirt under cardigan) — only use if it genuinely improves the outfit
- styleNote should reference the person's specific features from their style profile
- Occasions should vary: mix Casual, Work, Date Night, Night Out, Weekend
- Respond with ONLY the JSON array, nothing else`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      max_tokens: 1500
    });

    const responseText = completion.choices[0]?.message?.content || '[]';

    let outfits = [];
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      outfits = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse outfit JSON:', parseErr);
      outfits = [];
    }

    console.log(`Generated ${outfits.length} personalized outfits`);
    res.json({ outfits });
  } catch (error) {
    console.error('Generate styled outfits error:', error);
    res.status(500).json({ error: 'Failed to generate outfits', details: error.message });
  }
});

// 1. Rate Outfit Endpoint
app.post('/api/rate-outfit', async (req, res) => {
  try {
    const { image, occasion, mode, userId } = req.body;

    if (!image || !occasion || !mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Rating outfit for user ${userId} - ${occasion} - ${mode} mode`);

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
    const rating = ratingMatch
      ? parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3])
      : 7;

    console.log(`Rating complete: ${rating}/10`);

    res.json({
      rating: Math.min(Math.max(rating, 1), 10),
      feedback: response
    });
  } catch (error) {
    console.error('Rate Outfit Error:', error);
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

    console.log(`Comparing ${images.length} outfits for user ${userId} - ${occasion}`);

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

    console.log(`Comparison complete. Best: Outfit ${bestIndex + 1} (${ratings[bestIndex]}/10)`);

    res.json({
      ratings,
      bestIndex,
      analysis: response,
      mixSuggestion: response.includes('mix')
        ? response
        : 'Try combining elements from your top-rated outfits!'
    });
  } catch (error) {
    console.error('Compare Outfits Error:', error);
    res.status(500).json({ error: 'Failed to compare outfits', details: error.message });
  }
});

// 3. Analyze Product Endpoint
// Accepts both 'image' and 'productImage' field names
// Title is optional — AI infers from image if not provided
// Wardrobe items are used to suggest matches and outfit combinations
app.post('/api/analyze-product', async (req, res) => {
  try {
    const { image, productImage, title, description, wardrobeItems } = req.body;

    const imageData = image || productImage;

    if (!imageData) {
      return res.status(400).json({ error: 'Missing required field: image' });
    }

    const productTitle = title || 'Unknown product';
    console.log(`Analyzing product: ${productTitle} — wardrobe items: ${wardrobeItems?.length || 0}`);

    // Build wardrobe context string for the AI
    const wardrobeContext = wardrobeItems && wardrobeItems.length > 0
      ? `The person already owns these items in their wardrobe:\n${wardrobeItems
          .map(item =>
            `- ${item.name}${item.color && item.color !== 'unspecified' ? ` (${item.color})` : ''}${item.category ? ` [${item.category}]` : ''}`
          )
          .join('\n')}`
      : 'The person has no items in their wardrobe yet.'

    const prompt = `You are a professional personal stylist and fashion analyst.

Analyze this clothing item and provide a detailed, personal assessment.

Product: ${productTitle}
${description ? `Description: ${description}` : ''}

${wardrobeContext}

Structure your response exactly as follows:

**WARDROBE MATCHES**
List 3-5 specific items from their wardrobe that would pair well with this item. For each match, explain in 1-2 sentences exactly why it works — mention colors, contrast, style compatibility, or occasion suitability. If they have no wardrobe items yet, suggest 3-5 types of items that would complement it and why.

**OUTFIT IDEAS**
Give 2-3 complete outfit combinations using this item alongside their existing wardrobe pieces. For each outfit, name the specific items and describe what occasion it is best suited for and why the combination works visually and stylistically.

**OVERALL ASSESSMENT**
Briefly cover:
- What type of item this is and who it suits best
- Its main strengths (versatility, color impact, style)
- Any concerns (fit, occasion limitations, gaps it does not fill)
- Wardrobe fit score: X/10 — how well it integrates with what they already own
- Verdict: Buy / Maybe / Skip — with one clear sentence explaining why

Keep the tone direct, specific, and personal. Always reference the person's actual wardrobe items by name wherever possible.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.7,
      max_tokens: 1200
    });

    const aiResponse = completion.choices?.[0]?.message?.content || 'No response generated';

    res.json({
      success: true,
      analysis: aiResponse
    });
  } catch (error) {
    console.error('Product analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze product' });
  }
});

// 4. Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, userEmail, plan, billingCycle } = req.body;

    console.log('Creating checkout session for:', { userId, userEmail, plan, billingCycle });

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

    console.log(`Checkout session created: ${session.id} for user ${userId}`);

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe Checkout error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 5. Create Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    return res.status(400).json({
      error: 'Customer portal not available. Please contact support.'
    });
  } catch (error) {
    console.error('Portal session error:', error);
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Webhook: /api/stripe-webhook`);
  console.log(`Ping: /api/ping`);
  console.log(`Geocoding: /api/geocode`);
  console.log(`AI Stylist: /api/analyze-style-photo + /api/generate-styled-outfits`);
  console.log(`Product Analysis: /api/analyze-product (with wardrobe matching)`);
});