import { useState } from 'react'
import QRCode from 'qrcode'
import { Link } from 'react-router-dom'
import { useStore, inr, fmtDate, canWrite } from '../store'
import { I } from './icons'
import { PageHead, Card, StatusBadge, EmptyState } from './ui'

/* Real UPI intent link — scanning/opening it opens the client's UPI app */
const makeUpiLink = ({ pa, pn, am, tn }) =>
  `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}` +
  (am ? `&am=${Number(am).toFixed(2)}` : '') +
  `&cu=INR${tn ? `&tn=${encodeURIComponent(tn)}` : ''}`

export default function Requests() {
  const { user, qr, requests, addRequest, setRequestStatus, removeRequest } = useStore()
  const writable = canWrite(user)
  const isOrg = user.type === 'organization'
  const displayName = isOrg ? user.orgName : user.name

  const [tab, setTab] = useState('in') // 'in' receive / 'out' pay
  const [form, setForm] = useState({ party: '', amount: '', note: '' })
  const [active, setActive] = useState(null) // { req, link, qrUrl }
  const [err, setErr] = useState('')

  const generate = async (req) => {
    const link = makeUpiLink({
      pa: req.upiId,
      pn: req.direction === 'in' ? req.name : req.party,
      am: req.amount,
      tn: req.note,
    })
    const qrUrl = await QRCode.toDataURL(link, { width: 340, margin: 1 })
    setActive({ req, link, qrUrl })
  }

  const receiveSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!qr?.upiId) return setErr('Add your UPI ID first — open My QR (or Company QR) page. Clients pay into that account.')
    if (!form.party || !(form.amount > 0)) return setErr('Enter the client name and a valid amount.')
    const req = addRequest({
      direction: 'in',
      party: form.party,
      amount: form.amount,
      note: form.note,
      upiId: qr.upiId,
      name: displayName,
    })
    setForm({ party: '', amount: '', note: '' })
    await generate(req)
  }

  const paySubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!(form.party.includes('@'))) return setErr("Enter the recipient's UPI ID (e.g. vendor@okhdfc).")
    if (!(form.amount > 0)) return setErr('Enter a valid amount.')
    const req = addRequest({
      direction: 'out',
      party: form.party, // recipient's UPI ID
      amount: form.amount,
      note: form.note,
      upiId: form.party,
      name: displayName,
    })
    setForm({ party: '', amount: '', note: '' })
    await generate(req)
  }

  const shareWhatsApp = (r) => {
    const text =
      `Hi ${r.party}, payment request from ${r.name}: ${inr(r.amount)}` +
      (r.note ? ` (${r.note})` : '') +
      `. Pay via UPI → ${makeUpiLink({ pa: r.upiId, pn: r.name, am: r.amount, tn: r.note })}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400'
  const label = 'mb-1 block text-xs font-medium text-slate-500'

  return (
    <div>
      <PageHead
        title="Request & Pay"
        subtitle="Send live UPI payment requests to clients, pay vendors, and track statuses."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="relative flex h-2 w-2"><span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
          Live
        </span>
      </PageHead>

      {/* Generated request preview (QR + link + share) */}
      {active && writable && (
        <Card className="mb-6 border-indigo-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              {active.req.direction === 'in' ? '✨ Payment request ready to send' : '✨ Ready to pay'}
            </h2>
            <button onClick={() => setActive(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">{I.x('h-5 w-5')}</button>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <img src={active.qrUrl} alt="UPI QR" className="w-48 rounded-2xl border-8 border-indigo-100 shadow-lg" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-2xl font-extrabold text-slate-900">{inr(active.req.amount)}</p>
              <p className="mt-1 text-sm text-slate-600">
                {active.req.direction === 'in' ? `From ${active.req.party}` : `To ${active.req.party}`} · UPI {active.req.upiId}
              </p>
              {active.req.note && <p className="mt-1 text-xs text-slate-400">📝 {active.req.note}</p>}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => navigator.clipboard.writeText(active.link)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  🔗 Copy UPI link
                </button>
                <button
                  onClick={() => shareWhatsApp(active.req)}
                  className="ml-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  💬 Share on WhatsApp
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Scan the QR or open the link with any UPI app (GPay / PhonePe / Paytm / any bank app). The money moves
                straight to <strong>{active.req.upiId}</strong> — then mark it received below and it lands on your books.
              </p>
            </div>
          </div>
        </Card>
      )}

      {writable ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Request from client */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Receive a payment</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">money in</span>
            </div>
            <form onSubmit={receiveSubmit} className="space-y-4">
              <div><label className={label}>Client / payer name</label>
                <input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="e.g. Bloom & Co." className={input} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Amount (₹)</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="5000" className={input} /></div>
                <div><label className={label}>Note</label>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Invoice #42" className={input} /></div>
              </div>
              <p className="text-xs text-slate-400">Funds go to your UPI: <strong>{qr?.upiId || 'not set yet'}</strong></p>
              <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                Generate payment QR & link
              </button>
            </form>
          </Card>

          {/* Pay someone */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Make a payment</h2>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">money out</span>
            </div>
            <form onSubmit={paySubmit} className="space-y-4">
              <div><label className={label}>Recipient UPI ID</label>
                <input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="vendor@okhdfcbank" className={input} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Amount (₹)</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="2500" className={input} /></div>
                <div><label className={label}>Note</label>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Payment for order #18" className={input} /></div>
              </div>
              <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                Prepare UPI payment
              </button>
            </form>
          </Card>
        </div>
      ) : (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Viewer role — you can see payment requests but cannot send them.</p>
      )}

      {/* Requests list */}
      {err && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{err}</p>}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-bold text-slate-900">Payment requests ({sorted.length})</h2>
          <p className="text-xs text-slate-400">Statuses update live across tabs</p>
        </div>
        {sorted.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState message="No payment requests yet." />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-6 py-4 sm:flex-nowrap">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${r.direction === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {r.direction === 'in' ? '↓' : '↑'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {r.direction === 'in' ? `${r.party} → you` : `you → ${r.party}`}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {inr(r.amount)} · UPI {r.upiId} · {fmtDate(r.createdAt)}{r.note ? ` · ${r.note}` : ''}
                  </p>
                </div>
                <StatusBadge status={r.status === 'paid' ? 'completed' : r.status} />
                {writable && r.status === 'pending' && (
                  <>
                    <button onClick={() => generate(r)} title="Show QR & link again" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">⧉</button>
                    <button onClick={() => setRequestStatus(r.id, 'paid')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500">Mark received</button>
                    <button onClick={() => setRequestStatus(r.id, 'cancelled')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  </>
                )}
                <button onClick={() => removeRequest(r.id)} title="Delete" className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-600">{I.x('h-4 w-4')}</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
