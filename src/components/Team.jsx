import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore, fmtDate, canAccess, ROLE_COLORS as ROLE_COLORS_MAP } from '../store'
import { I } from './icons'
import { PageHead, Card, EmptyState } from './ui'

const ROLE_COLORS = ROLE_COLORS_MAP

export default function Team() {
  const { user, members, addMember, removeMember } = useStore()
  const [form, setForm] = useState({ name: '', email: '', role: 'Operations' })
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')

  // Admin-only (organization accounts)
  if (user.type !== 'organization' || !canAccess('team', user)) return <Navigate to="/app" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    setErr(''); setDone('')
    const out = addMember(form)
    if (out.ok) {
      setForm({ name: '', email: '', role: 'Operations' })
      setDone(`${out.ok ? 'Invite sent to ' + form.email : ''}`)
      setTimeout(() => setDone(''), 2500)
    } else setErr(out.error)
  }

  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400'
  const label = 'mb-1 block text-xs font-medium text-slate-500'

  return (
    <div>
      <PageHead title="Team" subtitle={`People who can access the ${user.orgName} dashboard.`} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invite */}
        <Card>
          <h2 className="font-bold text-slate-900">Invite a teammate</h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Name</label>
                <input value={form.name} onChange={set('name')} placeholder="e.g. Priya Nair" className={input} />
              </div>
              <div>
                <label className={label}>Email</label>
                <input value={form.email} onChange={set('email')} placeholder="priya@company.in" className={input} required />
              </div>
            </div>
            <div>
              <label className={label}>Role</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(ROLE_COLORS).map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      form.role === r ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {err && <p className="text-sm font-medium text-red-600">{err}</p>}
            {done && <p className="text-sm font-medium text-emerald-600">✓ {done}</p>}
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
              {I.plus('h-4 w-4')} Send invite
            </button>
          </form>
        </Card>

        {/* Members */}
        <Card className="p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="font-bold text-slate-900">Members ({members.length})</h2>
          </div>
          {members.length === 0 ? (
            <div className="px-6 pb-6"><EmptyState message="No teammates yet." /></div>
          ) : (
            <ul className="divide-y divide-slate-100 px-6 pb-4">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                    {m.name[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{m.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.email} · joined {fmtDate(m.addedOn)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role] || ROLE_COLORS.Viewer}`}>
                    {m.role}
                  </span>
                  <button onClick={() => removeMember(m.id)} title="Remove" className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600">
                    {I.x('h-4 w-4')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
