// API Endpoint: Compare Multiple Outfits
// Analyzes 2-5 outfit images and provides comparative ratings

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images, occasion, userId } = req.body;

    // Validation
    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({ 
        error: 'Please provide at least 2 images to compare' 
      });
    }

    if (images.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 outfits can be compared at once' 
      });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Build the prompt for comparison
    const occasionContext = occasion && occasion !== 'none' 
      ? `These outfits are for: ${occasion}.` 
      : 'No specific occasion provided.';

    // Create image content array for Groq Vision API
    const imageContents = images.map((image, index) => ({
      type: "image_url",
      image_url: {
        url: image
      }
    }));

    const prompt = `You are an expert fashion stylist comparing multiple outfits.

TASK: Analyze these ${images.length} outfits and provide:
1. A rating (1-10) for EACH outfit
2. Identify which outfit is the BEST choice
3. Provide detailed comparative analysis
4. Suggest mix-and-match opportunities

CONTEXT: ${occasionContext}

RATING CRITERIA:
- Fit and tailoring
- Color coordination
- Style appropriateness for occasion
- Overall aesthetic appeal
- Attention to detail

OUTPUT FORMAT (MUST follow exactly):
{
  "ratings": [rating1, rating2, rating3, ...],
  "bestIndex": indexOfBestOutfit,
  "analysis": "Detailed comparison of all outfits, explaining why the best one stands out and what makes others less suitable. Be specific about colors, fits, and styling choices.",
  "mixSuggestion": "Suggestion for combining elements from different outfits to create an even better look (e.g., 'Try outfit 1's top with outfit 2's pants')"
}

IMPORTANT:
- Ratings must be numbers 1-10
- bestIndex is 0-based (0 for first outfit, 1 for second, etc.)
- Analysis should be 3-4 sentences minimum
- Mix suggestion should be practical and specific
- Be honest but constructive

Respond ONLY with valid JSON, no other text.`;

    // Call Groq Vision API
    console.log(`Comparing ${images.length} outfits for user ${userId}`);

    const completion = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            ...imageContents
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log('Raw Groq response:', responseText);

    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      
      // Fallback: create a basic response
      result = {
        ratings: images.map(() => 7), // Default rating
        bestIndex: 0,
        analysis: "Unable to generate detailed analysis. All outfits show good potential!",
        mixSuggestion: "Try mixing elements from different outfits for variety."
      };
    }

    // Validate response structure
    if (!result.ratings || !Array.isArray(result.ratings)) {
      result.ratings = images.map(() => 7);
    }

    if (typeof result.bestIndex !== 'number') {
      result.bestIndex = 0;
    }

    if (!result.analysis) {
      result.analysis = "All outfits have their unique strengths.";
    }

    if (!result.mixSuggestion) {
      result.mixSuggestion = null;
    }

    // Ensure ratings array matches number of images
    if (result.ratings.length !== images.length) {
      result.ratings = images.map(() => 7);
    }

    // Ensure bestIndex is valid
    if (result.bestIndex < 0 || result.bestIndex >= images.length) {
      result.bestIndex = 0;
    }

    console.log('Comparison complete:', {
      numOutfits: images.length,
      ratings: result.ratings,
      bestIndex: result.bestIndex
    });

    // Return the comparison results
    return res.status(200).json({
      ratings: result.ratings,
      bestIndex: result.bestIndex,
      analysis: result.analysis,
      mixSuggestion: result.mixSuggestion
    });

  } catch (error) {
    console.error('Compare outfits error:', error);

    // Handle specific Groq API errors
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'API authentication failed. Please check configuration.' 
      });
    }

    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again in a moment.' 
      });
    }

    if (error.message?.includes('timeout')) {
      return res.status(504).json({ 
        error: 'Request timed out. Please try again with smaller images.' 
      });
    }

    // Generic error response
    return res.status(500).json({ 
      error: 'Failed to compare outfits. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}