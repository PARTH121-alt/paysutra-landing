// Razorpay webhook — the authoritative confirmation that money moved.
// Configure in Razorpay Dashboard → Webhooks → add endpoint:
//   https://<your-domain>/api/webhook   (events: payment_link.paid, payment.captured)
import { createClient } from '@supabase/supabase-js'

const admin = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const signature = req.headers['x-razorpay-signature']
  if (!secret || !signature) return res.status(400).json({ error: 'Webhook not configured' })

  const crypto = await import('node:crypto')
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex')
  if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' })

  const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const type = event?.event
  const sb = admin()

  try {
    if (type === 'payment_link.paid') {
      const link = event.payload?.payment_link?.entity
      const payment = event.payload?.payment?.entity
      const requestId = link?.notes?.request_id || link?.reference_id
      if (requestId) {
        const { data: reqRow } = await sb.from('payment_requests').select('*').eq('id', requestId).single()
        if (reqRow && reqRow.status !== 'paid') {
          await sb.from('payment_requests').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', requestId)
          await sb.from('transactions').insert({
            owner_id: reqRow.owner_id,
            org_id: reqRow.org_id,
            type: reqRow.direction === 'in' ? 'in' : 'out',
            party: reqRow.party,
            method: 'razorpay',
            amount: reqRow.amount,
            status: 'completed',
            note: reqRow.note || 'Razorpay payment',
            date: new Date().toISOString().slice(0, 10),
          })
        }
      }
      return res.json({ ok: true })
    }

    if (type === 'payment.captured') {
      const payment = event.payload?.payment?.entity
      const requestId = payment?.notes?.request_id
      if (requestId) {
        const { data: reqRow } = await sb.from('payment_requests').select('*').eq('id', requestId).single()
        if (reqRow && reqRow.status !== 'paid') {
          await sb.from('payment_requests').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', requestId)
          await sb.from('transactions').insert({
            owner_id: reqRow.owner_id,
            org_id: reqRow.org_id,
            type: reqRow.direction === 'in' ? 'in' : 'out',
            party: reqRow.party,
            method: 'razorpay',
            amount: reqRow.amount,
            status: 'completed',
            note: reqRow.note || 'Razorpay payment',
            date: new Date().toISOString().slice(0, 10),
          })
        }
      }
      return res.json({ ok: true })
    }

    res.json({ ok: true, ignored: type })
  } catch (e) {
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
