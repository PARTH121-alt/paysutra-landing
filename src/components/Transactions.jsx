import { useState } from 'react'
import { useStore, inr, fmtDate } from '../store'
import { I } from './icons'
import { PageHead, Card, StatusBadge, EmptyState } from './ui'

const METHODS = ['upi', 'card', 'netbanking', 'neft', 'wallet']

function AddForm({ onClose }) {
  const { user, addTxn } = useStore()
  const [f, setF] = useState({
    type: 'in', party: '', amount: '', method: 'upi', status: 'completed', note: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (!f.party || !f.amount) return
    addTxn({ ...f, amount: Number(f.amount) })
    onClose()
  }

  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400'
  const label = 'mb-1 block text-xs font-medium text-slate-500'

  return (
    <Card className="mb-6 border-indigo-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Record a {f.type === 'in' ? 'collection' : 'payment'}</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">{I.x('h-5 w-5')}</button>
      </div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="grid w-fit grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            {['in', 'out'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setF({ ...f, type: t })}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${f.type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t === 'in' ? 'Money in' : 'Money out'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label}>{user.type === 'organization' ? 'Customer / vendor' : 'Party name'}</label>
          <input value={f.party} onChange={set('party')} placeholder={f.type === 'in' ? 'e.g. Bloom & Co.' : 'e.g. AWS India'} className={input} required />
        </div>
        <div>
          <label className={label}>Amount (₹)</label>
          <input type="number" min="0" value={f.amount} onChange={set('amount')} placeholder="5000" className={input} required />
        </div>
        <div>
          <label className={label}>Date</label>
          <input type="date" value={f.date} onChange={set('date')} className={input} />
        </div>
        <div>
          <label className={label}>Method</label>
          <select value={f.method} onChange={set('method')} className={input}>
            {METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Status</label>
          <select value={f.status} onChange={set('status')} className={input}>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className={label}>Note (optional)</label>
          <input value={f.note} onChange={set('note')} placeholder="Invoice #, order id..." className={input} />
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
            Save transaction
          </button>
        </div>
      </form>
    </Card>
  )
}

export default function Transactions() {
  const { txns, setStatus, removeTxn } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus2] = useState('all')

  const filtered = txns
    .filter((t) => (type === 'all' ? true : t.type === type))
    .filter((t) => (status === 'all' ? true : t.status === status))
    .filter((t) => (q ? (t.party + t.note).toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => b.date.localeCompare(a.date))

  const exportCsv = () => {
    const rows = [
      ['date', 'type', 'party', 'method', 'amount', 'status', 'note'],
      ...filtered.map((t) => [t.date, t.type, JSON.stringify(t.party), t.method, t.amount, t.status, JSON.stringify(t.note)]),
    ]
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'paysutra-transactions.csv'
    a.click()
  }

  const tbl = 'px-4 py-3 text-sm'
  const select = 'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400'

  return (
    <div>
      <PageHead title="Transactions" subtitle="Record, search, track and export every payment." />

      {showAdd && <AddForm onClose={() => setShowAdd(false)} />}

      <Card className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <span className="absolute top-2.5 left-3 text-slate-400">{I.search('h-5 w-5')}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search party or note..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={select}>
          <option value="all">All types</option>
          <option value="in">Money in</option>
          <option value="out">Money out</option>
        </select>
        <select value={status} onChange={(e) => setStatus2(e.target.value)} className={select}>
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
          {I.download('h-4 w-4')} Export CSV
        </button>
        <button onClick={() => setShowAdd((s) => !s)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          {I.plus('h-4 w-4')} New payment
        </button>
      </Card>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState message="No transactions match your filters." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className={tbl}>Party</th>
                  <th className={tbl}>Date</th>
                  <th className={tbl}>Method</th>
                  <th className={tbl}>Note</th>
                  <th className={tbl}>Status</th>
                  <th className={`${tbl} text-right`}>Amount</th>
                  <th className={`${tbl} text-right`}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-50/70">
                    <td className={tbl}>
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${t.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {t.type === 'in' ? '↓' : '↑'}
                        </span>
                        <span className="font-semibold text-slate-800">{t.party}</span>
                      </div>
                    </td>
                    <td className={`${tbl} text-slate-500`}>{fmtDate(t.date)}</td>
                    <td className={`${tbl} uppercase text-slate-500`}>{t.method}</td>
                    <td className={`${tbl} max-w-40 truncate text-slate-500`}>{t.note || '—'}</td>
                    <td className={tbl}>
                      {t.status === 'pending' ? (
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={t.status} />
                          <button onClick={() => setStatus(t.id, 'completed')} title="Mark completed" className="rounded-md bg-emerald-100 p-1 text-emerald-700 hover:bg-emerald-200">{I.check('h-3.5 w-3.5')}</button>
                          <button onClick={() => setStatus(t.id, 'failed')} title="Mark failed" className="rounded-md bg-red-100 p-1 text-red-700 hover:bg-red-200">{I.x('h-3.5 w-3.5')}</button>
                        </div>
                      ) : (
                        <StatusBadge status={t.status} />
                      )}
                    </td>
                    <td className={`${tbl} text-right font-bold ${t.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'in' ? '+' : '−'} {inr(t.amount)}
                    </td>
                    <td className={`${tbl} text-right`}>
                      <button onClick={() => removeTxn(t.id)} title="Delete" className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600">{I.x('h-4 w-4')}</button>
                    </td>
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
