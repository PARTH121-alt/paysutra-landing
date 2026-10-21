import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

/* Real Google Sign-In is enabled when VITE_GOOGLE_CLIENT_ID is set.
   Without it, a demo account-chooser keeps the flow functional. */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleLogo({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 01-2.4 3.62v3h3.86c2.26-2.09 3.57-5.17 3.57-8.86z" fill="#4285F4" />
      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0012 24z" fill="#34A853" />
      <path d="M5.27 14.29A7.2 7.2 0 014.89 12c0-.8.14-1.56.38-2.29V6.62H1.29a12 12 0 000 10.76l3.98-3.09z" fill="#FBBC05" />
      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" fill="#EA4335" />
    </svg>
  )
}

function GoogleModal({ onPick, onClose }) {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!v.includes('@') || !v.includes('.')) return setErr('Enter a valid Google email address.')
    onPick(v)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GoogleLogo className="mx-auto h-8 w-8" />
        <h2 className="mt-4 text-center text-xl font-bold text-gray-800">Choose an account</h2>
        <p className="mt-1 text-center text-sm text-gray-500">to continue to <strong>PaySutra</strong></p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            autoFocus
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr('') }}
            placeholder="you@gmail.com"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
          />
          {err && <p className="text-xs font-medium text-red-600">{err}</p>}
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">
            Continue
          </button>
        </form>
        <button onClick={onClose} className="mt-2 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
          Cancel
        </button>
        <p className="mt-4 text-center text-[10px] leading-relaxed text-gray-400">
          This opens the full Google Sign-In flow when a Client ID is configured
          (.env → VITE_GOOGLE_CLIENT_ID). Currently running in demo mode.
        </p>
      </div>
    </div>
  )
}

export default function Login() {
  const { signIn, signUp } = useStore()
  const navigate = useNavigate()

  const [tab, setTab] = useState('signin')            // 'signin' | 'signup'
  const [type, setType] = useState('organization')    // signup account type
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [err, setErr] = useState('')
  const [googleOpen, setGoogleOpen] = useState(false)

  /* If a real Google Client ID exists, load Google Identity Services.
     Google sign-up always creates a PERSONAL account (per requirement). */
  useEffect(() => {
    if (!CLIENT_ID || tab !== 'signup') return
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (res) => {
          try {
            const payload = JSON.parse(
              atob(res.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
            )
            const out = signUp({
              email: payload.email,
              name: payload.given_name || payload.email.split('@')[0],
              type: 'personal',
              provider: 'google',
            })
            if (out.ok) navigate('/app')
            else setErr(out.error)
          } catch { setErr('Could not read Google profile. Try again.') }
        },
      })
      window.google.accounts.id.renderButton(document.getElementById('gsi-button'), {
        theme: 'outline', size: 'large', text: 'signup_with', shape: 'pill',
      })
    }
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [CLIENT_ID, tab, signUp, navigate])

  const swap = (t) => { setTab(t); setErr('') }

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    const out = tab === 'signin'
      ? signIn({ email })
      : signUp({ email, name, type, orgName })
    if (out.ok) navigate('/app')
    else setErr(out.error)
  }

  const googleDemoPick = (gEmail) => {
    setGoogleOpen(false)
    const out = signUp({ email: gEmail, name: gEmail.split('@')[0], type: 'personal', provider: 'google' })
    if (out.ok) navigate('/app')
    else setErr(out.error)
  }

  const showGoogle = tab === 'signup' && type === 'personal'
  const input = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder-slate-400 focus:border-indigo-400'
  const label = 'mb-1.5 block text-sm font-medium text-slate-300'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="pointer-events-none fixed -top-40 left-1/3 h-96 w-96 animate-float rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 right-1/3 h-96 w-96 animate-float-delayed rounded-full bg-violet-600/30 blur-3xl" />

      {googleOpen && <GoogleModal onPick={googleDemoPick} onClose={() => setGoogleOpen(false)} />}

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black">₹</span>
          <span className="text-xl font-bold tracking-tight">Pay<span className="text-indigo-400">Sutra</span></span>
        </Link>

        {/* Sign in / Create account tabs */}
        <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-slate-800 p-1.5">
          {['signin', 'signup'].map((t) => (
            <button key={t} type="button" onClick={() => swap(t)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === t ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          {tab === 'signup' && (
            <div>
              <label className={label}>Account type</label>
              <div className="grid grid-cols-2 gap-2">
                {['personal', 'organization'].map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                      type === t
                        ? 'border-indigo-400 bg-indigo-500/20 text-white'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}>
                    {t}
                    <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                      {t === 'personal' ? 'Hmm... just my payments' : 'For my business' }
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'signup' && type === 'organization' && (
            <div>
              <label className={label}>Organization name</label>
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. FabMart Pvt Ltd" className={input} />
            </div>
          )}

          <div>
            <label className={label}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
          </div>

          {tab === 'signup' && (
            <div>
              <label className={label}>{type === 'organization' ? 'Your name (admin)' : 'Your name'}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Parth Singh" className={input} />
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {err}
            </div>
          )}

          <button type="submit" className="w-full rounded-xl bg-indigo-500 px-4 py-3.5 font-semibold text-white transition hover:bg-indigo-400">
            {tab === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Divider + Google (personal sign-up only) */}
        {showGoogle && (
          <>
            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500">or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            {CLIENT_ID && window.google ? (
              <div id="gsi-button" className="flex justify-center" />
            ) : (
              <button
                type="button"
                onClick={() => setGoogleOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <GoogleLogo />
                Sign up with Google
              </button>
            )}
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Google sign-up creates a Personal account.
            </p>
          </>
        )}
        <p className="mt-5 text-center text-[11px] text-slate-500">
          By continuing you agree to our <Link to="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link> —
          all data stays locally in this browser.
        </p>
      </div>
    </div>
  )
}
