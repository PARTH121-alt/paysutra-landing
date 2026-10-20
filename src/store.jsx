import React, { createContext, useContext, useEffect, useState } from 'react'

/* ------------ localStorage-backed store: auth + transactions ------------- */

const USER_KEY = 'paysutra:user'
const ACCOUNTS_KEY = 'paysutra:accounts'
const TXN_KEY = 'paysutra:transactions'
const MEMBERS_KEY = 'paysutra:members'

const uid = () => Math.random().toString(36).slice(2, 10)

function seedTransactions() {
  const mk = (date, type, party, method, amount, status, note = '') => ({
    id: uid(), date, type, party, method, amount, status, note,
  })
  return [
    mk('2026-07-03', 'in', 'Kwikcart', 'upi', 24000, 'completed', 'Order batch #1023'),
    mk('2026-07-15', 'out', 'Ashwin Logistics', 'neft', 8500, 'completed', 'Delivery partner'),
    mk('2026-07-22', 'in', 'Bloom & Co.', 'card', 18600, 'completed', 'Retail sales'),
    mk('2026-08-01', 'in', 'Kwikcart', 'upi', 31500, 'completed', 'Order batch #1102'),
    mk('2026-08-09', 'out', 'AWS India', 'card', 11200, 'completed', 'Cloud hosting'),
    mk('2026-08-18', 'in', 'Priya Nair', 'upi', 5200, 'completed', 'Consulting retainer'),
    mk('2026-08-27', 'out', 'Office Rent — Sept', 'neft', 40000, 'completed', 'Premises'),
    mk('2026-09-05', 'in', 'LedgerLy', 'netbanking', 27800, 'completed', 'Invoice L-204'),
    mk('2026-09-14', 'in', 'Bloom & Co.', 'card', 22000, 'pending', 'Awaiting 3DS confirm'),
    mk('2026-09-23', 'out', 'Ashwin Logistics', 'neft', 9800, 'completed', 'Delivery partner'),
    mk('2026-10-02', 'in', 'Kwikcart', 'upi', 152000, 'completed', 'Festive sale settlement'),
    mk('2026-10-08', 'in', 'Rahul Mehta', 'upi', 7400, 'completed', 'Invoice R-87'),
    mk('2026-10-12', 'out', 'Ad Campaign — Meta', 'card', 25600, 'completed', 'Marketing'),
    mk('2026-10-16', 'in', 'Bloom & Co.', 'upi', 48200, 'completed', 'Diwali order batch'),
    mk('2026-10-19', 'out', 'Vendor Payout — Fabrics', 'neft', 68000, 'pending', 'Scheduled payout'),
  ]
}

function seedMembers() {
  return [
    { id: uid(), name: 'Ananya Sharma', email: 'ananya@kwikcart.in', role: 'Admin', addedOn: '2026-08-12' },
    { id: uid(), name: 'Rahul Mehta', email: 'rahul@kwikcart.in', role: 'Finance', addedOn: '2026-09-01' },
  ]
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [accounts, setAccounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [] } catch { return [] }
  })
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [txns, setTxns] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TXN_KEY))
      return Array.isArray(saved) && saved.length ? saved : seedTransactions()
    } catch { return seedTransactions() }
  })
  const [members, setMembers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(MEMBERS_KEY))
      return Array.isArray(saved) && saved.length ? saved : seedMembers()
    } catch { return seedMembers() }
  })

  useEffect(() => {
    user ? localStorage.setItem(USER_KEY, JSON.stringify(user))
         : localStorage.removeItem(USER_KEY)
  }, [user])
  useEffect(() => { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)) }, [accounts])
  useEffect(() => { localStorage.setItem(TXN_KEY, JSON.stringify(txns)) }, [txns])
  useEffect(() => { localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)) }, [members])

  /* ---- auth ---- */

  const signUp = ({ email, name, type, orgName = '', provider = 'email' }) => {
    const normalized = String(email || '').trim().toLowerCase()
    if (!normalized) return { ok: false, error: 'Please enter an email.' }
    if (accounts.some((a) => a.email === normalized)) {
      return { ok: false, error: 'An account with this email already exists. Try signing in instead.' }
    }
    const acct = {
      email: normalized,
      name: (name || '').trim() || normalized.split('@')[0],
      type: type === 'organization' ? 'organization' : 'personal',
      orgName: type === 'organization' ? ((orgName || '').trim() || normalized.split('@')[0] + "'s Org") : name,
      provider,
      joined: new Date().toISOString().slice(0, 10),
    }
    setAccounts((prev) => [...prev, acct])
    setUser(acct)
    return { ok: true }
  }

  const signIn = ({ email }) => {
    const normalized = String(email || '').trim().toLowerCase()
    const acct = accounts.find((a) => a.email === normalized)
    if (!acct) return { ok: false, error: 'No account found with this email. Create an account below.' }
    setUser(acct)
    return { ok: true }
  }

  const logout = () => setUser(null)

  const updateProfile = (profile) => {
    setUser((u) => {
      const next = { ...u, ...profile }
      setAccounts((prev) => prev.map((a) => (a.email === u.email ? next : a)))
      return next
    })
  }

  /* ---- transactions ---- */

  const addTxn = (t) => {
    const txn = { id: uid(), date: t.date || new Date().toISOString().slice(0, 10), ...t }
    setTxns((prev) => [txn, ...prev])
    return txn
  }
  const setStatus = (id, status) =>
    setTxns((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  const removeTxn = (id) => setTxns((prev) => prev.filter((t) => t.id !== id))
  const resetDemo = () => {
    setTxns(seedTransactions())
    setMembers(seedMembers())
  }

  /* ---- org team members ---- */

  const addMember = ({ name, email, role = 'Operations' }) => {
    if (!email || !email.includes('@')) return { ok: false, error: 'Enter a valid email.' }
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'This teammate is already added.' }
    }
    const member = {
      id: uid(),
      name: (name || '').trim() || email.split('@')[0],
      email: email.trim(),
      role,
      addedOn: new Date().toISOString().slice(0, 10),
    }
    setMembers((prev) => [member, ...prev])
    return { ok: true }
  }
  const removeMember = (id) => setMembers((prev) => prev.filter((m) => m.id !== id))

  return (
    <StoreContext.Provider
      value={{
        accounts, user, txns, members,
        signUp, signIn, logout, updateProfile,
        addTxn, setStatus, removeTxn, resetDemo,
        addMember, removeMember,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)

/* ------------------------------ helpers ------------------------------ */

export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
