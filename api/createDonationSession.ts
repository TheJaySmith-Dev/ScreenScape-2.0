import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const origin = (req.headers['referer'] as string) || (process.env.PUBLIC_ORIGIN as string) || 'http://localhost:3000';
    const paymentLink = process.env.STRIPE_DONATION_LINK || process.env.VITE_STRIPE_DONATION_LINK;
    if (paymentLink && typeof paymentLink === 'string' && paymentLink.length > 0) {
      return res.status(200).json({ url: paymentLink });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_DONATION_PRICE_ID || process.env.STRIPE_PRICE_ID;
    if (!secret || !priceId) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${origin}/?donation=success`);
    body.set('cancel_url', `${origin}/?donation=cancel`);
    body.set('line_items[0][price]', priceId);
    body.set('line_items[0][quantity]', '1');

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return res.status(500).json({ error: 'Failed to create session', detail: errText });
    }

    const data = await resp.json();
    const url = data?.url || data?.session?.url;
    if (!url) {
      return res.status(500).json({ error: 'Stripe did not return a checkout URL' });
    }
    return res.status(200).json({ url });
  } catch (e: any) {
    return res.status(500).json({ error: 'Unexpected error', detail: e?.message || String(e) });
  }
}

