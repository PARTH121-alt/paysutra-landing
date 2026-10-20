import { useMemo } from 'react'
import { useStore, inr, fmtDate } from '../store'
import { PageHead, Card, EmptyState } from './ui'

export default function Customers() {
  const { user, txns } = useStore()

  const parties = useMemo(() => {
    const map = {}
    txns.filter((t) => t.status !== 'failed').forEach((t) => {
      if (!map[t.party]) map[t.party] = { name: t.party, in: 0, out: 0, count: 0, last: t.date, methods: new Set() }
      map[t.party][t.type] += t.amount
      map[t.party].count += 1
      if (t.date > map[t.party].last) map[t.party].last = t.date
      map[t.party].methods.add(t.method)
    })
    return Object.values(map).sort((a, b) => b.in + b.out - (a.in + a.out))
  }, [txns])

  if (parties.length === 0) return <div><PageHead title="Customers" /><EmptyState message="No customers or vendors recorded yet." /></div>

  return (
    <div>
      <PageHead
        title={user.type === 'organization' ? 'Customers & vendors' : 'People & merchants'}
        subtitle="Grouped by party, sorted by total volume."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {parties.map((p) => {
          const net = p.in - p.out
          return (
            <Card key={p.name}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white">
                  {p.name[0].toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.count} transaction{p.count > 1 ? 's' : ''} · last on {fmtDate(p.last)}</p>
                </div>
                <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ${net >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {net >= 0 ? '+' : '−'} {inr(Math.abs(net))}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs font-medium text-emerald-700">Collected</p>
                  <p className="mt-0.5 font-bold text-emerald-800">{inr(p.in)}</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-xs font-medium text-rose-700">Paid out</p>
                  <p className="mt-0.5 font-bold text-rose-800">{inr(p.out)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...p.methods].map((m) => (
                  <span key={m} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">{m}</span>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
