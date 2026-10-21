import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, isCloud } from './lib/supabase'

/* ============================================================
   Store: dual-mode
   - CLOUD mode  (Supabase configured): real auth + Postgres +
     realtime live feeds + server-verified Razorpay payments
   - LOCAL mode  (no keys yet): localStorage, same API surface
   ============================================================ */

const USER_KEY = 'paysutra:user'
const ACCOUNTS_KEY = 'paysutra:accounts'
const MEMBERS_KEY = 'paysutra:members'
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
  const [mode] = useState(isCloud ? 'cloud' : 'local')
  const [ready, setReady] = useState(!isCloud)

  const [accounts, setAccounts] = useState(() => load(ACCOUNTS_KEY, []))
  const [user, setUser] = useState(() => load(USER_KEY, null))
  const email = user?.email || null

  const [txns, setTxns] = useState(() => (email ? load(txnKeyOf(email), []) : []))
  const [requests, setRequests] = useState(() => (email ? load(reqKeyOf(email), []) : []))
  const [qr, setQr] = useState(() => (email ? load(qrKeyOf(email), null) : null))
  const [members, setMembers] = useState(() => load(MEMBERS_KEY, []))

  /* ================= CLOUD HELPERS ================= */

  const cloudContext = async (authUser) => {
    // profile row decides account type; org membership decides role
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', authUser.id).maybeSingle()

    if (profile?.account_type === 'organization') {
      const { data: org } = await supabase
        .from('organizations').select('*').eq('owner_id', authUser.id).maybeSingle()
      if (org) {
        return {
          id: authUser.id, email: authUser.email,
          name: profile?.full_name || authUser.email.split('@')[0],
          type: 'organization', orgName: org.name, orgId: org.id, role: 'Admin',
          provider: 'email', joined: profile?.created_at?.slice(0, 10),
        }
      }
    }
    const { data: mem } = await supabase
      .from('org_members')
      .select('*, organizations(name)')
      .eq('email', authUser.email)
      .order('invited_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (mem?.org_id) {
      return {
        id: authUser.id, email: authUser.email,
        name: mem.name || profile?.full_name || authUser.email.split('@')[0],
        type: 'organization', orgName: mem.organizations?.name, orgId: mem.org_id,
        role: mem.role, provider: 'invite', joined: mem.invited_at?.slice(0, 10),
      }
    }
    return {
      id: authUser.id, email: authUser.email,
      name: profile?.full_name || authUser.email.split('@')[0],
      type: 'personal', orgName: profile?.full_name, role: 'Admin',
      provider: 'email', joined: profile?.created_at?.slice(0, 10),
    }
  }

  const cloudLoad = async (ctx) => {
    if (ctx.type === 'organization') {
      const [{ data: t }, { data: r }, { data: q }, { data: m }] = await Promise.all([
        supabase.from('transactions').select('*').eq('org_id', ctx.orgId).order('date', { ascending: false }),
        supabase.from('payment_requests').select('*').eq('org_id', ctx.orgId).order('created_at', { ascending: false }),
        supabase.from('qr_vault').select('*').eq('org_id', ctx.orgId).limit(1).maybeSingle(),
        supabase.from('org_members').select('*').eq('org_id', ctx.orgId).order('invited_at', { ascending: false }),
      ])
      setTxns(t || [])
      setRequests((r || []).map(mapReq))
      setQr(q ? mapQr(q) : null)
      setMembers((m || []).map((x) => ({
        id: x.id, name: x.name, email: x.email, role: x.role,
        orgName: ctx.orgName, addedOn: x.invited_at?.slice(0, 10),
      })))
    } else {
      const [{ data: t }, { data: r }, { data: q }] = await Promise.all([
        supabase.from('transactions').select('*').eq('owner_id', ctx.id).order('date', { ascending: false }),
        supabase.from('payment_requests').select('*').eq('owner_id', ctx.id).order('created_at', { ascending: false }),
        supabase.from('qr_vault').select('*').eq('owner_id', ctx.id).limit(1).maybeSingle(),
      ])
      setTxns(t || [])
      setRequests((r || []).map(mapReq))
      setQr(q ? mapQr(q) : null)
      setMembers([])
    }
  }

  const mapReq = (r) => ({
    ...r,
    upiId: r.upi_id,
    name: r.name,
    createdAt: (r.created_at || '').slice(0, 10),
    paidAt: r.paid_at,
    razorpayUrl: r.razorpay_url,
    razorpayLinkId: r.razorpay_link_id,
  })
  const mapQr = (q) => ({ name: q.name, upiId: q.upi_id, dataUrl: q.image_url })

  /* ============ CLOUD: auth bootstrap + realtime ============ */

  useEffect(() => {
    if (!isCloud) return
    let channel = null

    const boot = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const ctx = await cloudContext(session.user)
        setUser(ctx)
        await cloudLoad(ctx)
        channel = supabase
          .channel('paysutra-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (p) => {
            if (p.eventType === 'INSERT') setTxns((prev) => [p.new, ...prev.filter((x) => x.id !== p.new.id)])
            else if (p.eventType === 'UPDATE') setTxns((prev) => prev.map((x) => (x.id === p.new.id ? p.new : x)))
            else if (p.eventType === 'DELETE') setTxns((prev) => prev.filter((x) => x.id !== p.old.id))
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, (p) => {
            if (p.eventType === 'INSERT') setRequests((prev) => [mapReq(p.new), ...prev.filter((x) => x.id !== p.new.id)])
            else if (p.eventType === 'UPDATE') setRequests((prev) => prev.map((x) => (x.id === p.new.id ? mapReq(p.new) : x)))
            else if (p.eventType === 'DELETE') setRequests((prev) => prev.filter((x) => x.id !== p.old.id))
          })
          .subscribe()
      }
      setReady(true)
    }
    boot()

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        channel && supabase.removeChannel(channel)
        return
      }
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        const ctx = await cloudContext(session.user)
        setUser(ctx)
        await cloudLoad(ctx)
        setReady(true)
      }
    })

    return () => { authSub?.subscription?.unsubscribe(); channel && supabase.removeChannel(channel) }
  }, [])

  /* ============ LOCAL: persistence + live cross-tab sync ============ */

  useEffect(() => {
    if (isCloud) return
    user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY)
  }, [user])
  useEffect(() => {
    if (isCloud) return
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
  }, [accounts, members])

  useEffect(() => {
    if (isCloud) return
    const onStorage = (e) => {
      if (e.key === USER_KEY) return setUser(load(USER_KEY, null))
      if (e.key === ACCOUNTS_KEY) return setAccounts(load(ACCOUNTS_KEY, []))
      if (e.key === MEMBERS_KEY) return setMembers(load(MEMBERS_KEY, []))
      const cur = load(USER_KEY, null)
      if (!cur) return
      if (e.key === txnKeyOf(cur.email)) setTxns(load(txnKeyOf(cur.email), []))
      else if (e.key === reqKeyOf(cur.email)) setRequests(load(reqKeyOf(cur.email), []))
      else if (e.key === qrKeyOf(cur.email)) setQr(load(qrKeyOf(cur.email), null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /* ---- auth ---- */

  const signUp = async ({ email: mail, password, name, type, orgName = '', provider = 'email' }) => {
    const normalized = String(mail || '').trim().toLowerCase()
    if (!normalized) return { ok: false, error: 'Please enter an email.' }

    if (isCloud) {
      if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
      const { error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { full_name: name, account_type: type, org_name: orgName } },
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    }

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

  const signIn = async ({ email: mail, password }) => {
    const normalized = String(mail || '').trim().toLowerCase()

    if (isCloud) {
      const { error } = await supabase.auth.signInWithPassword({ email: normalized, password })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    }

    const acct = accounts.find((a) => a.email === normalized)
    if (acct) { setUser(acct); return { ok: true } }
    const member = members.find((m) => m.email.toLowerCase() === normalized)
    if (member?.orgName) {
      setUser({
        email: member.email, name: member.name, type: 'organization',
        orgName: member.orgName, role: member.role, provider: 'invite', joined: member.addedOn,
      })
      return { ok: true }
    }
    return { ok: false, error: 'No account or invitation found for this email. Create an account below.' }
  }

  /* Google Sign-Up — REAL OAuth in cloud mode; personal accounts only */
  const googleSignUp = async () => {
    if (isCloud) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/app' },
      })
      return { ok: true } // redirect takes over
    }
    return { ok: false, error: 'google-demo' } // caller opens the demo chooser
  }

  const logout = async () => {
    if (isCloud) await supabase.auth.signOut()
    setUser(null)
  }

  const updateProfile = async (profile) => {
    if (isCloud && user) {
      await supabase.from('profiles').update({
        full_name: profile.name,
        org_name: profile.orgName,
      }).eq('id', user.id)
      if (user.orgId && profile.orgName) {
        await supabase.from('organizations').update({ name: profile.orgName }).eq('id', user.orgId)
      }
      setUser((u) => ({ ...u, ...profile }))
      return
    }
    setUser((u) => {
      const next = { ...u, ...profile }
      setAccounts((prev) => prev.map((a) => (a.email === u.email ? next : a)))
      return next
    })
  }

  /* ---- transactions ---- */

  const addTxn = async (t) => {
    if (!canWrite(user)) return { ok: false, error: 'forbidden' }
    const txn = { id: uid(), date: t.date || new Date().toISOString().slice(0, 10), ...t }
    if (isCloud && user) {
      const { data, error } = await supabase.from('transactions').insert({
        owner_id: user.id,
        org_id: user.type === 'organization' ? user.orgId : null,
        type: t.type, party: t.party, method: t.method || 'upi',
        amount: Number(t.amount), status: t.status || 'completed',
        note: t.note || '', date: txn.date,
      }).select().single()
      if (error) return { ok: false, error: error.message }
      return data // realtime inserts it into state
    }
    setTxns((prev) => [txn, ...prev])
    if (email) {
      const cur = load(txnKeyOf(email), [])
      localStorage.setItem(txnKeyOf(email), JSON.stringify([txn, ...cur]))
    }
    return txn
  }

  const setStatus = async (id, status) => {
    if (isCloud) { await supabase.from('transactions').update({ status }).eq('id', id); return }
    setTxns((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    if (email) {
      const cur = load(txnKeyOf(email), [])
      localStorage.setItem(txnKeyOf(email), JSON.stringify(cur.map((t) => (t.id === id ? { ...t, status } : t))))
    }
  }

  const removeTxn = async (id) => {
    if (isCloud) { await supabase.from('transactions').delete().eq('id', id); return }
    setTxns((prev) => prev.filter((t) => t.id !== id))
    if (email) {
      const cur = load(txnKeyOf(email), [])
      localStorage.setItem(txnKeyOf(email), JSON.stringify(cur.filter((t) => t.id !== id)))
    }
  }

  const clearAllData = async () => {
    if (isCloud && user) {
      const { data: t } = await supabase.from('transactions').select('id').eq(user.type === 'organization' ? 'org_id' : 'owner_id', user.type === 'organization' ? user.orgId : user.id)
      if (t?.length) await supabase.from('transactions').delete().in('id', t.map((x) => x.id))
      const { data: r } = await supabase.from('payment_requests').select('id').eq(user.type === 'organization' ? 'org_id' : 'owner_id', user.type === 'organization' ? user.orgId : user.id)
      if (r?.length) await supabase.from('payment_requests').delete().in('id', r.map((x) => x.id))
      await supabase.from('qr_vault').delete().eq(user.type === 'organization' ? 'org_id' : 'owner_id', user.type === 'organization' ? user.orgId : user.id)
      if (user.type === 'organization') {
        const { data: m } = await supabase.from('org_members').select('id').eq('org_id', user.orgId).neq('role', 'Admin')
        if (m?.length) await supabase.from('org_members').delete().in('id', m.map((x) => x.id))
      }
      setTxns([]); setRequests([]); setQr(null)
      return
    }
    if (!email) return
    setTxns([]); setRequests([]); setQr(null)
    localStorage.removeItem(txnKeyOf(email))
    localStorage.removeItem(reqKeyOf(email))
    localStorage.removeItem(qrKeyOf(email))
    if (user.type === 'organization') setMembers((prev) => prev.filter((m) => m.orgName !== user.orgName))
  }

  /* ---- payment QR vault ---- */

  const saveQr = async ({ name, upiId, dataUrl }) => {
    const next = { name, upiId: (upiId || '').trim(), dataUrl: dataUrl || null }
    setQr(next)
    if (isCloud && user) {
      const { data: existing } = await supabase.from('qr_vault').select('id').eq('owner_id', user.id).maybeSingle()
      const payload = { name, upi_id: next.upiId, image_url: next.dataUrl }
      if (existing) await supabase.from('qr_vault').update(payload).eq('id', existing.id)
      else await supabase.from('qr_vault').insert({
        owner_id: user.id, org_id: user.type === 'organization' ? user.orgId : null, ...payload,
      })
    } else if (email) {
      localStorage.setItem(qrKeyOf(email), JSON.stringify(next))
    }
  }

  const removeQr = async () => {
    setQr(null)
    if (isCloud && user) await supabase.from('qr_vault').delete().eq('owner_id', user.id)
    else if (email) localStorage.removeItem(qrKeyOf(email))
  }

  /* ---- payment requests ---- */

  const addRequest = async ({ direction, party, amount, note, upiId, name }) => {
    if (!canWrite(user)) return { ok: false, error: 'forbidden' }
    const local = {
      id: uid(), direction, party, amount: Number(amount), note: note || '',
      upiId, name, status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10), paidAt: null,
    }
    if (isCloud && user) {
      const { data, error } = await supabase.from('payment_requests').insert({
        owner_id: user.id,
        org_id: user.type === 'organization' ? user.orgId : null,
        direction, party, amount: Number(amount), note: note || '', upi_id: upiId, name,
      }).select().single()
      if (error) return { ok: false, error: error.message }
      return mapReq(data)
    }
    setRequests((prev) => [local, ...prev])
    if (email) {
      const cur = load(reqKeyOf(email), [])
      localStorage.setItem(reqKeyOf(email), JSON.stringify([local, ...cur]))
    }
    return local
  }

  const setRequestStatus = async (id, status) => {
    const req = requests.find((r) => r.id === id)
    if (!req) return
    if (isCloud) {
      const { error } = await supabase.from('payment_requests')
        .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) return
      if (status === 'paid') {
        await addTxn({
          type: req.direction === 'in' ? 'in' : 'out',
          party: req.party, amount: req.amount, method: 'upi',
          status: 'completed', note: req.note || `UPI ${req.direction === 'in' ? 'collection' : 'payment'}`,
        })
      }
      return
    }
    const next = requests.map((r) => (r.id === id ? { ...r, status } : r))
    setRequests(next)
    if (email) localStorage.setItem(reqKeyOf(email), JSON.stringify(next))
    if (status === 'paid') {
      addTxn({
        type: req.direction === 'in' ? 'in' : 'out',
        party: req.party, amount: req.amount, method: 'upi',
        status: 'completed', note: req.note || `UPI ${req.direction === 'in' ? 'collection' : 'payment'}`,
      })
    }
  }

  /** Save a Razorpay payment link on the request (cloud only) */
  const attachRazorpayLink = async (id, linkId, url) => {
    if (isCloud) {
      await supabase.from('payment_requests')
        .update({ razorpay_link_id: linkId, razorpay_url: url }).eq('id', id)
    }
  }

  const removeRequest = async (id) => {
    if (isCloud) { await supabase.from('payment_requests').delete().eq('id', id); return }
    setRequests((prev) => prev.filter((r) => r.id !== id))
    if (email) {
      const cur = load(reqKeyOf(email), [])
      localStorage.setItem(reqKeyOf(email), JSON.stringify(cur.filter((r) => r.id !== id)))
    }
  }

  /* ---- org team members ---- */

  const addMember = async ({ name, email: mail, role = 'Operations' }) => {
    if (!mail || !mail.includes('@')) return { ok: false, error: 'Enter a valid email.' }
    if (members.some((m) => m.email.toLowerCase() === mail.toLowerCase())) {
      return { ok: false, error: 'This teammate is already added.' }
    }
    if (isCloud && user?.orgId) {
      const { data, error } = await supabase.from('org_members').insert({
        org_id: user.orgId, email: mail.trim(), name: (name || '').trim() || mail.split('@')[0], role,
      }).select().single()
      if (error) return { ok: false, error: error.message }
      setMembers((prev) => [{ id: data.id, name: data.name, email: data.email, role: data.role, orgName: user.orgName, addedOn: data.invited_at?.slice(0, 10) }, ...prev])
      return { ok: true }
    }
    const member = {
      id: uid(),
      name: (name || '').trim() || mail.split('@')[0],
      email: mail.trim(), role, orgName: user.orgName,
      addedOn: new Date().toISOString().slice(0, 10),
    }
    setMembers((prev) => [member, ...prev])
    return { ok: true }
  }

  const removeMember = async (id) => {
    if (isCloud) { await supabase.from('org_members').delete().eq('id', id) }
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <StoreContext.Provider
      value={{
        mode, ready, accounts, user, txns, members, qr, requests,
        signUp, signIn, googleSignUp, logout, updateProfile,
        addTxn, setStatus, removeTxn, clearAllData,
        addMember, removeMember,
        saveQr, removeQr, addRequest, setRequestStatus, removeRequest, attachRazorpayLink,
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
