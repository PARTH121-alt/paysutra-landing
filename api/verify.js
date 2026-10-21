// Verifies a Razorpay Checkout signature (order flow) — client then records the txn
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return res.status(500).json({ error: 'Razorpay is not configured' })

  const { orderId, paymentId, signature } = req.body || {}
  if (!orderId || !paymentId || !signature) return res.status(400).json({ error: 'Missing fields' })

  const crypto = await import('node:crypto')
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  if (expected !== signature) return res.status(400).json({ valid: false, error: 'Signature mismatch' })
  res.json({ valid: true })
}
