import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = JSON.parse(req.body || '{}');

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await resend.emails.send({
      from: 'AI Outfit Rater <hello@outfitrater.xyz>',
      to: email,
      subject: 'Welcome to AI Outfit Rater!',
      html: `
        <h2>Welcome to AI Outfit Rater 👗✨</h2>
        <p>We’re excited to help you level up your style.</p>
        <p>Start by rating your first outfit — it only takes a moment.</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
