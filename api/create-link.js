// Creates a Razorpay Payment Link — the shareable link you send to clients
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay is not configured' })

  const { amount, name, note, referenceId, upiId } = req.body || {}
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  try {
    const resp = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'inr',
        accept_partial: false,
        description: note || `Payment request from ${name || 'PaySutra'}`,
        reference_id: referenceId || undefined,
        reminder_enable: false,
        notes: { upi_id: upiId || '', payee: name || '' },
      }),
    })
    const data = await resp.json()
    if (!resp.ok) return res.status(resp.status).json(data)
    res.json({ id: data.id, shortUrl: data.short_url })
  } catch (e) {
    res.status(500).json({ error: 'Failed to create payment link' })
  }
}
