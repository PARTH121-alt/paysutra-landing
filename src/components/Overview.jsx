import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore, inr, fmtDate } from '../store'
import { I } from './icons'
import { PageHead, Card, StatusBadge } from './ui'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Overview() {
  const { user, txns } = useStore()

  const stats = useMemo(() => {
    const live = txns.filter((t) => t.status !== 'failed')
    const inSum = live.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0)
    const outSum = live.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0)
    return {
      balance: inSum - outSum,
      inSum,
      outSum,
      pending: txns.filter((t) => t.status === 'pending').length,
    }
  }, [txns])

  const months = useMemo(() => {
    // last 6 months of in/out totals
    const now = new Date()
    const buckets = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MONTHS[d.getMonth()],
        in: 0,
        out: 0,
      })
    }
    const map = Object.fromEntries(buckets.map((b) => [b.key, b]))
    txns.filter((t) => t.status !== 'failed').forEach((t) => {
      const b = map[t.date.slice(0, 7)]
      if (b) b[t.type] += t.amount
    })
    return buckets
  }, [txns])

  const max = Math.max(1, ...months.map((m) => Math.max(m.in, m.out)))
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  const cards = [
    { label: 'Available balance', value: inr(stats.balance), icon: I.home, cls: 'text-indigo-600 bg-indigo-100' },
    { label: 'Total collected', value: inr(stats.inSum), icon: I.arrowUp, cls: 'text-emerald-600 bg-emerald-100' },
    { label: 'Total paid out', value: inr(stats.outSum), icon: I.arrowDown, cls: 'text-rose-600 bg-rose-100' },
    { label: 'Pending transactions', value: stats.pending, icon: I.clock, cls: 'text-amber-600 bg-amber-100' },
  ]

  return (
    <div>
      <PageHead
        title={`Hi, ${user.name} 👋`}
        subtitle={user.type === 'organization' ? `Payments for ${user.orgName}` : 'Your personal payments'}
      >
        <Link to="/app/transactions" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
          {I.plus('h-4 w-4')} New payment
        </Link>
      </PageHead>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.cls}`}>{c.icon('h-5 w-5')}</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{c.label}</p>
              <p className="mt-0.5 truncate text-xl font-bold text-slate-900">{c.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Chart */}
        <Card className="lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Cash flow — last 6 months</h2>
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-400" /> In</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-400" /> Out</span>
            </div>
          </div>
          <div className="flex h-56 items-end justify-between gap-3">
            {months.map((m) => (
              <div key={m.key} className="group flex flex-1 flex-col items-center">
                <div className="flex h-48 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/3 rounded-t bg-emerald-400/90 transition group-hover:bg-emerald-400"
                    style={{ height: `${(m.in / max) * 100}%` }}
                    title={`In: ${inr(m.in)}`}
                  />
                  <div
                    className="w-1/3 rounded-t bg-rose-400/90 transition group-hover:bg-rose-400"
                    style={{ height: `${(m.out / max) * 100}%` }}
                    title={`Out: ${inr(m.out)}`}
                  />
                </div>
                <span className="mt-2 text-xs font-medium text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent activity</h2>
            <Link to="/app/transactions" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{t.party}</p>
                  <p className="text-xs text-slate-500">{fmtDate(t.date)} · {t.method.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${t.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'in' ? '+' : '−'} {inr(t.amount)}
                  </p>
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
