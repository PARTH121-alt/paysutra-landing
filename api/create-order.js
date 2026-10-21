// Creates a Razorpay Order for in-app "Pay now" checkout (money out / client pay)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay is not configured' })

  const { amount, receipt, notes } = req.body || {}
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  try {
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency: 'inr',
        receipt: receipt || undefined,
        notes: notes || {},
      }),
    })
    const data = await resp.json()
    if (!resp.ok) return res.status(resp.status).json(data)
    res.json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId })
  } catch (e) {
    res.status(500).json({ error: 'Failed to create order' })
  }
}
