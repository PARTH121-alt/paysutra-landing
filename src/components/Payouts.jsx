import { useState } from 'react'
import { useStore, inr, fmtDate, canWrite } from '../store'
import { I } from './icons'
import { PageHead, Card, StatusBadge, EmptyState } from './ui'

export default function Payouts() {
  const { user, txns, addTxn, setStatus } = useStore()
  const writable = canWrite(user)
  const payouts = txns.filter((t) => t.type === 'out').sort((a, b) => b.date.localeCompare(a.date))

  const settled = payouts.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const pending = payouts.filter((t) => t.status === 'pending').reduce((s, t) => s + t.amount, 0)
  const failed = payouts.filter((t) => t.status === 'failed').reduce((s, t) => s + t.amount, 0)

  const [form, setForm] = useState({ party: '', amount: '', note: '', date: new Date().toISOString().slice(0, 10) })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400'

  const submit = (e) => {
    e.preventDefault()
    if (!form.party || !form.amount) return
    addTxn({ type: 'out', method: 'neft', status: 'pending', amount: Number(form.amount), ...form })
    setForm({ party: '', amount: '', note: '', date: new Date().toISOString().slice(0, 10) })
  }

  return (
    <div>
      <PageHead
        title="Payouts"
        subtitle={writable ? 'Schedule settlements, approve pending payouts and monitor outgoing money.' : 'Viewer access — read only.'}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-slate-500">Settled</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{inr(settled)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Pending approval</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{inr(pending)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Failed</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{inr(failed)}</p>
        </Card>
      </div>

      {writable && (
      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-slate-900">Request a payout</h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Pay to</label>
            <input value={form.party} onChange={set('party')} placeholder="Vendor / employee" className={input} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Amount (₹)</label>
            <input type="number" min="0" value={form.amount} onChange={set('amount')} placeholder="10000" className={input} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
            <input type="date" value={form.date} onChange={set('date')} className={input} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
              Schedule payout
            </button>
          </div>
        </form>
      </Card>
      )}

      <Card className="overflow-hidden p-0">
        {payouts.length === 0 ? (
          <div className="p-6"><EmptyState message="No payouts yet — schedule your first one above." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Payee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-800">{t.party}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(t.date)}</td>
                    <td className="max-w-40 truncate px-4 py-3 text-slate-500">{t.note || '—'}</td>
                    <td className="px-4 py-3">
                      {writable && t.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={t.status} />
                          <button
                            onClick={() => setStatus(t.id, 'completed')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500"
                          >
                            {I.check('h-3.5 w-3.5')} Approve & settle
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status={t.status} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">− {inr(t.amount)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
