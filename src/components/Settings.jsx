import { useState } from 'react'
import { useStore, canAccess } from '../store'
import { PageHead, Card } from './ui'

export default function Settings() {
  const { user, updateProfile, clearAllData } = useStore()
  const [f, setF] = useState({ name: user.name, orgName: user.orgName || user.name })
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    updateProfile(f)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400'
  const label = 'mb-1 block text-xs font-medium text-slate-500'

  return (
    <div>
      <PageHead title="Settings" subtitle="Your PaySutra account preferences." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <h2 className="font-bold text-slate-900">Profile</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{user.email}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
              {user.provider === 'google' ? '🟢 Signed up with Google' : '📧 Email account'}
            </span>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className={label}>Account type</label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm capitalize text-slate-700">{user.type}</div>
            </div>
            {user.type === 'organization' && (
              <div>
                <label className={label}>Organization name</label>
                <input value={f.orgName} onChange={set('orgName')} className={input} required />
              </div>
            )}
            <div>
              <label className={label}>{user.type === 'organization' ? 'Administrator name' : 'Name'}</label>
              <input value={f.name} onChange={set('name')} className={input} required />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                Save changes
              </button>
              {saved && <span className="text-sm font-medium text-emerald-600">✓ Saved</span>}
            </div>
          </form>
        </Card>

        {/* Data */}
        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-slate-900">Data</h2>
            <p className="mt-2 text-sm text-slate-600">
              All your transactions and team data live in this browser via localStorage — nothing leaves your device.
              Use <strong>Export CSV</strong> on the Transactions page to back it up.
            </p>
          </Card>
          <Card className="border-rose-200">
            <h2 className="font-bold text-rose-700">Danger zone</h2>
            <p className="mt-2 text-sm text-slate-600">Erase all transactions and team members for this browser. This cannot be undone.</p>
            <button
              onClick={() => { if (window.confirm('Erase all data? This wipes every transaction and teammate, permanently.')) clearAllData() }}
              className="mt-4 rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              Erase all data
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
