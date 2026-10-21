import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore, inr, canAccess } from '../store'
import { I } from './icons'

export default function DashboardLayout({ children }) {
  const { user, txns, logout } = useStore()
  const navigate = useNavigate()

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  const isOrg = user.type === 'organization'
  const displayName = isOrg ? user.orgName : user.name
  const role = isOrg ? user.role || 'Admin' : null

  /* Separate navigation dashboards per account type — filtered by RBAC */
  const base = '/app'
  const orgLinks = [
    { to: base, label: 'Overview', icon: I.home, page: 'overview', end: true },
    { to: `${base}/transactions`, label: 'Transactions', icon: I.txn, page: 'transactions' },
    { to: `${base}/requests`, label: 'Request & Pay', icon: I.out, page: 'requests' },
    { to: `${base}/payouts`, label: 'Payouts', icon: I.out, page: 'payouts' },
    { to: `${base}/customers`, label: 'Customers', icon: I.users, page: 'customers' },
    { to: `${base}/qr`, label: 'Company QR', icon: I.card, page: 'qr' },
    { to: `${base}/team`, label: 'Team', icon: I.gear, page: 'team' },
    { to: `${base}/settings`, label: 'Settings', icon: I.settings, page: 'settings' },
  ]
  const navLinks = isOrg
    ? orgLinks.filter((l) => canAccess(l.page, user))
    : [
        { to: base, label: 'Overview', icon: I.home, end: true },
        { to: `${base}/transactions`, label: 'Payments', icon: I.txn },
        { to: `${base}/requests`, label: 'Request & Pay', icon: I.out },
        { to: `${base}/qr`, label: 'My QR', icon: I.card },
        { to: `${base}/customers`, label: 'Contacts', icon: I.users },
        { to: `${base}/settings`, label: 'Settings', icon: I.settings },
      ]

  const balance = txns.reduce(
    (sum, t) => sum + (t.status === 'failed' ? 0 : (t.type === 'in' ? t.amount : -t.amount)),
    0,
  )

  const doLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-slate-950 p-6 md:flex">
        <NavLink to="/" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black">₹</span>
          <span className="text-lg font-bold tracking-tight">Pay<span className="text-indigo-400">Sutra</span></span>
        </NavLink>

        {/* Account identity card */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
              {displayName[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              {isOrg && <p className="truncate text-[10px] text-slate-500">{user.email}</p>}
            </div>
          </div>
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
            isOrg ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {isOrg ? `Organization · ${role}` : 'Personal'}
          </span>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {l.icon('h-5 w-5')}
              {l.label}
              {l.label === 'Team' && (
                <span className="ml-auto rounded-full bg-violet-500/20 px-1.5 text-[9px] font-bold uppercase text-violet-300">Org</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs text-slate-500">Available balance</p>
          <p className="mt-1 text-xl font-bold text-white">{inr(balance)}</p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <button onClick={doLogout} title="Sign out" className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white">
            {I.logout('h-5 w-5')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between bg-slate-950 px-4 py-3 md:hidden">
          <NavLink to="/" className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 font-black">₹</span>
            <span className="font-bold">PaySutra</span>
          </NavLink>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isOrg ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300'}`}>
            {isOrg ? 'Organization' : 'Personal'}
          </span>
          <button onClick={doLogout} className="rounded-lg p-2 text-slate-400 hover:text-white">{I.logout('h-5 w-5')}</button>
        </div>
        {/* Mobile nav */}
        <nav className="flex overflow-x-auto border-b border-slate-200 bg-white px-2 md:hidden">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium ${isActive ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500'}`
              }
            >
              {l.icon('h-4 w-4')}
              {l.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-6 md:p-10">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
