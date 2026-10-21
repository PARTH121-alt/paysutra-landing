import React, { createContext, useContext, useEffect, useState } from 'react'

/* ------------ localStorage-backed store: auth + transactions ------------- */

const USER_KEY = 'paysutra:user'
const ACCOUNTS_KEY = 'paysutra:accounts'
const TXN_KEY = 'paysutra:transactions'
const MEMBERS_KEY = 'paysutra:members'
const QR_KEY = 'paysutra:qr'
const REQ_KEY = 'paysutra:requests'

const uid = () => Math.random().toString(36).slice(2, 10)

/* ------------------------------ RBAC ------------------------------- */

export const ROLE_COLORS = {
  Admin: 'bg-indigo-100 text-indigo-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Operations: 'bg-amber-100 text-amber-700',
  Viewer: 'bg-slate-100 text-slate-600',
}

/* Which dashboard pages each role may access.
   Account owners are always Admin. Invited teammates inherit their invite role. */
export const ROUTE_ROLES = {
  overview: ['Admin', 'Finance', 'Operations', 'Viewer'],
  transactions: ['Admin', 'Finance', 'Operations', 'Viewer'],
  payouts: ['Admin', 'Finance', 'Operations'],
  customers: ['Admin', 'Finance', 'Operations', 'Viewer'],
  requests: ['Admin', 'Finance', 'Operations', 'Viewer'],
  qr: ['Admin', 'Finance', 'Operations', 'Viewer'],
  team: ['Admin'],
  settings: ['Admin'],
}

/* Who may generate/act on payment requests and manage the QR vault */
const WRITE_ROLES = ['Admin', 'Finance', 'Operations']

export const canAccess = (page, user) =>
  user.type === 'personal' || ROUTE_ROLES[page]?.includes(user.role || 'Admin')

export const canWrite = (user) =>
  user.type === 'personal' || WRITE_ROLES.includes(user.role || 'Admin')

/* ------------------------------ store ------------------------------ */

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [accounts, setAccounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [] } catch { return [] }
  })
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  /* user-based data: no demo seed — every account starts clean */
  const [txns, setTxns] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TXN_KEY)) || [] } catch { return [] }
  })
  const [members, setMembers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MEMBERS_KEY)) || [] } catch { return [] }
  })
  /* uploaded / saved payment QR + sent payment requests */
  const [qr, setQr] = useState(() => {
    try { return JSON.parse(localStorage.getItem(QR_KEY)) } catch { return null }
  })
  const [requests, setRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem(REQ_KEY)) || [] } catch { return [] }
  })

  useEffect(() => {
    user ? localStorage.setItem(USER_KEY, JSON.stringify(user))
         : localStorage.removeItem(USER_KEY)
  }, [user])
  useEffect(() => { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)) }, [accounts])
  useEffect(() => { localStorage.setItem(TXN_KEY, JSON.stringify(txns)) }, [txns])
  useEffect(() => { localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)) }, [members])
  useEffect(() => {
    qr ? localStorage.setItem(QR_KEY, JSON.stringify(qr)) : localStorage.removeItem(QR_KEY)
  }, [qr])
  useEffect(() => { localStorage.setItem(REQ_KEY, JSON.stringify(requests)) }, [requests])

  /* ---- LIVE sync: instantly reflect changes made in other tabs/devices
     on the same browser profile (clients, owners, teammates). ---- */
  useEffect(() => {
    const onStorage = (e) => {
      const reload = (key, setter) => {
        if (e.key === key || e.key === null) {
          try {
            const v = e.key ? JSON.parse(e.newValue) : null
            setter(key === QR_KEY && e.key === null ? null : v)
          } catch { /* ignore malformed */ }
        }
      }
      reload(USER_KEY, setUser)
      reload(ACCOUNTS_KEY, setAccounts)
      reload(TXN_KEY, setTxns)
      reload(MEMBERS_KEY, setMembers)
      reload(QR_KEY, setQr)
      reload(REQ_KEY, setRequests)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /* ---- auth ---- */

  const signUp = ({ email, name, type, orgName = '', provider = 'email' }) => {
    const normalized = String(email || '').trim().toLowerCase()
    if (!normalized) return { ok: false, error: 'Please enter an email.' }
    if (accounts.some((a) => a.email === normalized)) {
      return { ok: false, error: 'An account with this email already exists. Try signing in instead.' }
    }
    const isOrg = type === 'organization'
    const acct = {
      email: normalized,
      name: (name || '').trim() || normalized.split('@')[0],
      type: isOrg ? 'organization' : 'personal',
      orgName: isOrg ? ((orgName || '').trim() || normalized.split('@')[0] + "'s Org") : name,
      role: 'Admin', // account owner = full access
      provider,
      joined: new Date().toISOString().slice(0, 10),
    }
    setAccounts((prev) => [...prev, acct])
    setUser(acct)
    return { ok: true }
  }

  /* Sign in works for BOTH account owners and invited teammates:
     - owner email  -> full role from their account
     - teammate email -> role granted when invited to the org */
  const signIn = ({ email }) => {
    const normalized = String(email || '').trim().toLowerCase()
    const acct = accounts.find((a) => a.email === normalized)
    if (acct) {
      setUser(acct)
      return { ok: true }
    }
    const member = members.find((m) => m.email.toLowerCase() === normalized)
    if (member?.orgName) {
      const memberUser = {
        email: member.email,
        name: member.name,
        type: 'organization',
        orgName: member.orgName,
        role: member.role,
        provider: 'invite',
        joined: member.addedOn,
      }
      setUser(memberUser)
      return { ok: true }
    }
    return { ok: false, error: 'No account or invitation found for this email. Create an account below.' }
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
    if (!canWrite(user)) return { ok: false, error: 'forbidden' }
    const txn = { id: uid(), date: t.date || new Date().toISOString().slice(0, 10), ...t }
    setTxns((prev) => [txn, ...prev])
    return txn
  }
  const setStatus = (id, status) => setTxns((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  const removeTxn = (id) => setTxns((prev) => prev.filter((t) => t.id !== id))

  const clearAllData = () => {
    setTxns([])
    setMembers([])
    setRequests([])
  }

  /* ---- payment QR vault ---- */

  const saveQr = ({ name, upiId, dataUrl }) => {
    setQr({ name, upiId: (upiId || '').trim(), dataUrl: dataUrl || null })
  }
  const removeQr = () => setQr(null)

  /* ---- payment requests (send & receive) ---- */

  const addRequest = ({ direction, party, amount, note, upiId, name }) => {
    const req = {
      id: uid(),
      direction, // 'in' = receiving from client, 'out' = paying someone
      party,
      amount: Number(amount),
      note: note || '',
      upiId, // UPI handle the money flows to/from
      name,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
      paidAt: null,
    }
    setRequests((prev) => [req, ...prev])
    return req
  }
  const setRequestStatus = (id, status) => {
    const req = requests.find((r) => r.id === id)
    if (!req) return
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    if (status === 'paid') {
      // completed request becomes a real transaction on the books
      addTxn({
        type: req.direction === 'in' ? 'in' : 'out',
        party: req.party,
        amount: req.amount,
        method: 'upi',
        status: 'completed',
        note: req.note || `UPI ${req.direction === 'in' ? 'collection' : 'payment'}`,
      })
    }
  }
  const removeRequest = (id) => setRequests((prev) => prev.filter((r) => r.id !== id))

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
      orgName: user.orgName, // ties the invite to this org, enabling member sign-in
      addedOn: new Date().toISOString().slice(0, 10),
    }
    setMembers((prev) => [member, ...prev])
    return { ok: true }
  }
  const removeMember = (id) => setMembers((prev) => prev.filter((m) => m.id !== id))

  return (
    <StoreContext.Provider
      value={{
        accounts, user, txns, members, qr, requests,
        signUp, signIn, logout, updateProfile,
        addTxn, setStatus, removeTxn, clearAllData,
        addMember, removeMember,
        saveQr, removeQr, addRequest, setRequestStatus, removeRequest,
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
