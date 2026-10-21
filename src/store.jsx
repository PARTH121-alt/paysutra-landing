import React, { createContext, useContext, useEffect, useState } from 'react'

/* ------------ localStorage-backed store: auth + per-user data ------------- */

const USER_KEY = 'paysutra:user'
const ACCOUNTS_KEY = 'paysutra:accounts'
const MEMBERS_KEY = 'paysutra:members' // invitation registry (shared, global)

/* ---- USER-BASED DATA: every account owns a private data namespace ---- */
const txnKeyOf = (e) => `paysutra:txns:${e}`
const reqKeyOf = (e) => `paysutra:reqs:${e}`
const qrKeyOf = (e) => `paysutra:qr:${e}`

const load = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v === null || v === undefined ? fallback : v
  } catch { return fallback }
}

const uid = () => Math.random().toString(36).slice(2, 10)

/* ------------------------------ RBAC ------------------------------- */

export const ROLE_COLORS = {
  Admin: 'bg-indigo-100 text-indigo-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Operations: 'bg-amber-100 text-amber-700',
  Viewer: 'bg-slate-100 text-slate-600',
}

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

const WRITE_ROLES = ['Admin', 'Finance', 'Operations']

export const canAccess = (page, user) =>
  user.type === 'personal' || ROUTE_ROLES[page]?.includes(user.role || 'Admin')

export const canWrite = (user) =>
  user.type === 'personal' || WRITE_ROLES.includes(user.role || 'Admin')

/* ------------------------------ store ------------------------------ */

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  /* Account registry stays global so any email can sign in on any tab */
  const [accounts, setAccounts] = useState(() => load(ACCOUNTS_KEY, []))
  const [user, setUser] = useState(() => load(USER_KEY, null))
  const email = user?.email || null

  /* Private, per-user data pools */
  const [txns, setTxns] = useState(() => (email ? load(txnKeyOf(email), []) : []))
  const [requests, setRequests] = useState(() => (email ? load(reqKeyOf(email), []) : []))
  const [qr, setQr] = useState(() => (email ? load(qrKeyOf(email), null) : null))
  const [members, setMembers] = useState(() => load(MEMBERS_KEY, []))

  /* load the active account's private pool when the account changes */
  useEffect(() => {
    if (!email) return
    setTxns(load(txnKeyOf(email), []))
    setRequests(load(reqKeyOf(email), []))
    setQr(load(qrKeyOf(email), null))
  }, [email])

  /* global singletons persist through effects */
  useEffect(() => {
    user ? localStorage.setItem(USER_KEY, JSON.stringify(user))
         : localStorage.removeItem(USER_KEY)
  }, [user])
  useEffect(() => { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)) }, [accounts])
  useEffect(() => { localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)) }, [members])

  /* ---- LIVE sync across tabs: instant per-account updates ---- */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === USER_KEY) { setUser(load(USER_KEY, null)); return }
      if (e.key === ACCOUNTS_KEY) { setAccounts(load(ACCOUNTS_KEY, [])); return }
      if (e.key === MEMBERS_KEY) { setMembers(load(MEMBERS_KEY, [])); return }
      const cur = load(USER_KEY, null)
      if (!cur) return
      if (e.key === txnKeyOf(cur.email)) setTxns(load(txnKeyOf(cur.email), []))
      else if (e.key === reqKeyOf(cur.email)) setRequests(load(reqKeyOf(cur.email), []))
      else if (e.key === qrKeyOf(cur.email)) setQr(load(qrKeyOf(cur.email), null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /* write-through mutation helpers — data only persists via explicit actions,
     so account switches can never leak one user's data into another's pool */
  const [emailRef] = useState({ current: null })
  emailRef.current = email

  const updateTxns = (fn) => {
    setTxns((prev) => {
      const next = fn(prev)
      if (emailRef.current) localStorage.setItem(txnKeyOf(emailRef.current), JSON.stringify(next))
      return next
    })
  }
  const updateRequests = (fn) => {
    setRequests((prev) => {
      const next = fn(prev)
      if (emailRef.current) localStorage.setItem(reqKeyOf(emailRef.current), JSON.stringify(next))
      return next
    })
  }

  /* ---- auth ---- */

  const signUp = ({ email: mail, name, type, orgName = '', provider = 'email' }) => {
    const normalized = String(mail || '').trim().toLowerCase()
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
      role: 'Admin',
      provider,
      joined: new Date().toISOString().slice(0, 10),
    }
    setAccounts((prev) => [...prev, acct])
    setUser(acct)
    return { ok: true }
  }

  /* Owners sign in with their account; invited teammates sign in with the
     email they were invited with and inherit their role. */
  const signIn = ({ email: mail }) => {
    const normalized = String(mail || '').trim().toLowerCase()
    const acct = accounts.find((a) => a.email === normalized)
    if (acct) { setUser(acct); return { ok: true } }
    const member = members.find((m) => m.email.toLowerCase() === normalized)
    if (member?.orgName) {
      setUser({
        email: member.email,
        name: member.name,
        type: 'organization',
        orgName: member.orgName,
        role: member.role,
        provider: 'invite',
        joined: member.addedOn,
      })
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

  /* ---- transactions (private to the signed-in account) ---- */

  const addTxn = (t) => {
    if (!canWrite(user)) return { ok: false, error: 'forbidden' }
    const txn = { id: uid(), date: t.date || new Date().toISOString().slice(0, 10), ...t }
    updateTxns((prev) => [txn, ...prev])
    return txn
  }
  const setStatus = (id, status) =>
    updateTxns((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  const removeTxn = (id) => updateTxns((prev) => prev.filter((t) => t.id !== id))

  const clearAllData = () => {
    if (!emailRef.current) return
    const e = emailRef.current
    setTxns([]); setRequests([]); setQr(null)
    localStorage.removeItem(txnKeyOf(e))
    localStorage.removeItem(reqKeyOf(e))
    localStorage.removeItem(qrKeyOf(e))
    if (user.type === 'organization') setMembers((prev) => prev.filter((m) => m.orgName !== user.orgName))
  }

  /* ---- payment QR vault (private per account) ---- */

  const saveQr = ({ name, upiId, dataUrl }) => {
    const next = { name, upiId: (upiId || '').trim(), dataUrl: dataUrl || null }
    setQr(next)
    if (emailRef.current) localStorage.setItem(qrKeyOf(emailRef.current), JSON.stringify(next))
  }
  const removeQr = () => {
    setQr(null)
    if (emailRef.current) localStorage.removeItem(qrKeyOf(emailRef.current))
  }

  /* ---- payment requests (private per account) ---- */

  const addRequest = ({ direction, party, amount, note, upiId, name }) => {
    if (!canWrite(user)) return { ok: false, error: 'forbidden' }
    const req = {
      id: uid(),
      direction, // 'in' = from client, 'out' = to a payee
      party,
      amount: Number(amount),
      note: note || '',
      upiId,
      name,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
      paidAt: null,
    }
    updateRequests((prev) => [req, ...prev])
    return req
  }
  const setRequestStatus = (id, status) => {
    const req = requests.find((r) => r.id === id)
    if (!req) return
    updateRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    if (status === 'paid') {
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
  const removeRequest = (id) => updateRequests((prev) => prev.filter((r) => r.id !== id))

  /* ---- org team members (global invitation registry) ---- */

  const addMember = ({ name, email: mail, role = 'Operations' }) => {
    if (!mail || !mail.includes('@')) return { ok: false, error: 'Enter a valid email.' }
    if (members.some((m) => m.email.toLowerCase() === mail.toLowerCase())) {
      return { ok: false, error: 'This teammate is already added.' }
    }
    const member = {
      id: uid(),
      name: (name || '').trim() || mail.split('@')[0],
      email: mail.trim(),
      role,
      orgName: user.orgName,
      addedOn: new Date().toISOString().slice(0, 10),
    }
    setMembers((prev) => [member, ...prev])
    return { ok: true }
  }
  const removeMember = (id) => setMembers((prev) => prev.filter((m) => m.id !== id))

  /* ---- one-time migration of the old shared data pool ---- */
  useEffect(() => {
    if (!user) return
    const e = user.email
    const migrate = (oldKey, newKey) => {
      if (localStorage.getItem(oldKey) !== null) {
        if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, localStorage.getItem(oldKey))
        localStorage.removeItem(oldKey)
      }
    }
    migrate('paysutra:transactions', txnKeyOf(e))
    migrate('paysutra:requests', reqKeyOf(e))
    migrate('paysutra:qr', qrKeyOf(e))
    setTxns(load(txnKeyOf(e), []))
    setRequests(load(reqKeyOf(e), []))
    setQr(load(qrKeyOf(e), null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
