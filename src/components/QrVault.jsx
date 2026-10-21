import { useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { useStore, canWrite } from '../store'
import { PageHead, Card, EmptyState } from './ui'

export default function QrVault() {
  const { user, qr, saveQr, removeQr } = useStore()
  const writable = canWrite(user)
  const isOrg = user.type === 'organization'
  const defaultName = isOrg ? user.orgName : user.name

  const [name, setName] = useState(qr?.name || defaultName)
  const [upiId, setUpiId] = useState(qr?.upiId || '')
  const [image, setImage] = useState(qr?.dataUrl || null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  /* Decode an uploaded QR image; if it is a real UPI QR we extract the UPI ID. */
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(''); setMsg('')
    if (!file.type.startsWith('image/')) return setErr('Please choose an image file (PNG/JPG with your UPI QR).')

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setImage(dataUrl)
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          ctx.drawImage(img, 0, 0)
          const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
          if (code?.data?.startsWith('upi://')) {
            const params = new URLSearchParams(code.data.split('?')[1])
            const pa = params.get('pa')
            const pn = params.get('pn')
            if (pa) {
              setUpiId(pa)
              if (pn && (!name || name === defaultName)) setName(pn)
              setMsg(`✓ UPI QR decoded — UPI ID set to ${pa}${pn ? ` · name: ${pn}` : ''}. Clients can now pay you by scanning your generated QR below.`)
              return
            }
          }
          setMsg('Image saved. It was not a recognisable UPI QR — enter your UPI ID manually to enable auto-requests.')
        } catch { setMsg('Image saved, but decoding failed — enter your UPI ID manually.') }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  /* Generated QR for your UPI ID — clients can scan this to pay you */
  const generated = upiId.includes('@')
    ? QRCode.toDataURL(
        `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || defaultName)}&cu=INR`,
        { width: 360, margin: 1 },
      )
    : null

  const save = (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (!image && !upiId.includes('@')) {
      return setErr('Upload your UPI QR image or enter a valid UPI ID (e.g. name@upi).')
    }
    saveQr({ name, upiId, dataUrl: image })
    setMsg('✓ Saved. You can now share your QR and request client payments.')
  }

  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400'
  const label = 'mb-1 block text-xs font-medium text-slate-500'

  return (
    <div>
      <PageHead
        title={isOrg ? 'Company QR' : 'My QR'}
        subtitle={writable ? 'Upload / generate your UPI QR so clients can pay you directly.' : 'Shared payment QR (read-only)'}
      />

      {!writable && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Viewer role — you can view the shared QR but cannot change it.</p>}

      {qr && (!writable) && (
        <Card className="mb-6 flex flex-col items-center gap-3 p-8 text-center">
          <img src={qr.dataUrl || ''} alt="QR" className="max-w-60 rounded-xl border border-slate-200" />
          <p className="font-bold text-slate-900">{qr.name}</p>
          {qr.upiId && <p className="text-sm text-slate-500">{qr.upiId}</p>}
        </Card>
      )}

      {writable && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload / edit */}
          <Card>
            <h2 className="font-bold text-slate-900">Your payment QR</h2>
            <p className="mt-1 text-sm text-slate-500">Upload the QR from your bank/UPI app — we auto-detect your UPI ID from it.</p>
            <form onSubmit={save} className="mt-5 space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
                <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
                {image ? (
                  <img src={image} alt="Uploaded QR" className="max-h-44 rounded-lg border border-slate-200" />
                ) : (
                  <>
                    <span className="text-3xl">⬆️</span>
                    <span className="text-sm font-medium text-slate-600">Click to upload your UPI QR image</span>
                    <span className="text-xs text-slate-400">PNG or JPG · membership of any UPI app (GPay, PhonePe, Paytm…)</span>
                  </>
                )}
              </label>

              <div>
                <label className={label}>Display name {isOrg ? '(business name shown to clients)' : ''}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder={defaultName} />
              </div>
              <div>
                <label className={label}>UPI ID {image && '(auto-filled if decoded)'}</label>
                <input value={upiId} onChange={(e) => { setUpiId(e.target.value); setMsg('') }} className={input} placeholder="yourname@upi" />
              </div>

              {err && <p className="text-sm font-medium text-red-600">{err}</p>}
              {msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}

              <div className="flex gap-3">
                <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">Save</button>
                {qr && (
                  <button type="button" onClick={() => { removeQr(); setImage(null); setUpiId(''); setMsg('QR removed.') }}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Remove</button>
                )}
              </div>
            </form>
          </Card>

          {/* Preview / generated */}
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="font-bold text-slate-900">Client-facing QR</h2>
            <p className="mt-1 text-sm text-slate-500">Clients can scan this with any UPI app to pay you.</p>
            {generated ? (
              <>
                <img src={generated} alt="Your UPI QR" className="mt-6 w-56 rounded-2xl border-8 border-indigo-100 shadow-lg" />
                <p className="mt-4 font-bold text-slate-900">{name || defaultName}</p>
                <p className="text-sm text-slate-500">{upiId}</p>
                <a
                  download={`paysutra-${(name || defaultName).replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                  href={generated}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  ⬇️ Download QR
                </a>
              </>
            ) : image ? (
              <>
                <img src={image} alt="Your QR" className="mt-6 max-h-56 rounded-xl border border-slate-200" />
                <p className="mt-4 text-sm text-slate-500">Uploaded QR — shown as-is. Add a UPI ID above to also generate a clean high-res QR.</p>
              </>
            ) : (
              <div className="mt-6 w-full">
                <EmptyState message="Add a UPI ID to generate your shareable payment QR." />
              </div>
            )}
          </Card>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        Next step: <Link to="/app/requests" className="font-medium text-indigo-600">Request & Pay →</Link> send one-time UPI requests to clients with custom amounts.
      </p>
    </div>
  )
}
