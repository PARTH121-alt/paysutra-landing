import React from 'react'
import { Link } from 'react-router-dom'
import { useStore, inr } from '../store'
import { I } from '../components/icons'

const Icon = ({ d, className = 'h-6 w-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const icons = {
  bolt: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  shield: 'M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z',
  chart: 'M2.25 18L9 11.25l4.306 4.307L18.75 7.5 21.75 4.5',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 4-5.5 4-9s-1.5-6.5-4-9m0 18c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9M3 12h18',
  card: 'M2.25 8.25h19.5M2.25 9h19.5M2.25 11.25h19.5M2.25 6h19.5v12a1.5 1.5 0 01-1.5 1.5h-16.5a1.5 1.5 0 01-1.5-1.5V6z',
  check: 'M4.5 12.75l6 6 9-13.5',
  arrow: 'M13.5 4.5L21 12l-7.5 7.5M21 12H3',
  plus: 'M12 4.5v15m7.5-7.5h-15',
  minus: 'M19.5 12h-15',
}

function Navbar() {
  const [open, setOpen] = React.useState(false)
  const { user } = useStore()
  const links = ['Features', 'How it works', 'Pricing', 'FAQ']
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black">₹</span>
          <span className="text-xl font-bold tracking-tight">Pay<span className="text-indigo-400">Sutra</span></span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`} className="text-sm text-slate-300 transition hover:text-white">{l}</a>
          ))}
        </div>
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <Link to="/app" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white">Sign in</Link>
              <Link to="/login" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">Get started</Link>
            </>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="text-white md:hidden" aria-label="Toggle menu">
          <Icon d={open ? icons.minus : icons.plus} className="h-7 w-7" />
        </button>
      </nav>
      {open && (
        <div className="space-y-2 border-t border-white/10 px-6 py-4 md:hidden">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setOpen(false)} className="block py-1 text-slate-300 hover:text-white">{l}</a>
          ))}
          <Link to={user ? '/app' : '/login'} className="mt-2 block rounded-lg bg-indigo-500 px-4 py-2 text-center font-semibold text-white">
            {user ? 'Open dashboard' : 'Get started'}
          </Link>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 md:py-28">
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 animate-float rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 animate-float-delayed rounded-full bg-violet-600/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Now live with UPI Autopay 2.0
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
          Smart payments for <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">modern India</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
          Accept payments, automate payouts and track every rupee — one platform for you or your organization.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/login" className="w-full rounded-xl bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 sm:w-auto">
            Start free
          </Link>
          <a href="#how-it-works" className="w-full rounded-xl border border-white/15 px-8 py-4 text-base font-semibold text-slate-200 transition hover:bg-white/5 sm:w-auto">
            See how it works
          </a>
        </div>
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-indigo-950/50 backdrop-blur">
            <div className="rounded-xl bg-slate-900 p-6 text-left">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <span className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <span className="rounded-md bg-white/5 px-3 py-1 text-xs text-slate-400">dashboard.paysutra.in</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Today\u2019s collections', value: '₹4,82,300', up: '+12.4%' },
                  { label: 'Payouts settled', value: '₹2,10,750', up: '+8.1%' },
                  { label: 'Success rate', value: '99.2%', up: '+0.6%' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/5 p-4">
                    <p className="text-xs text-slate-400">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-400">▲ {s.up}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex h-28 items-end gap-2">
                {[35, 52, 44, 70, 58, 80, 64, 90, 74, 96, 82, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-indigo-600/40 to-indigo-400" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const stats = [
    { value: '₹1,200 Cr+', label: 'Payments processed annually' },
    { value: '40,000+', label: 'Businesses onboard' },
    { value: '99.95%', label: 'Platform uptime' },
    { value: '18 sec', label: 'Avg. settlement time' },
  ]
  return (
    <section className="border-y border-slate-200 bg-white py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-slate-900 md:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: icons.card, title: 'Accept every payment', desc: 'UPI, cards, netbanking, wallets and EMI — one integration covers all Indian payment methods.' },
    { icon: icons.bolt, title: 'Instant payouts', desc: 'Automate vendor settlements and salary disbursements with 24×7 instant payout rails.' },
    { icon: icons.shield, title: 'Bank-grade security', desc: 'PCI-DSS Level 1 certified with real-time fraud detection and AI-powered risk scoring.' },
    { icon: icons.chart, title: 'Smart reconciliation', desc: 'Auto-match transactions with invoices and GST filings. Your books stay audit-ready.' },
    { icon: icons.globe, title: 'Global collections', desc: 'Accept payments in 135+ currencies and settle to your Indian account effortlessly.' },
    { icon: icons.arrow, title: 'One-click checkout', desc: 'Boost conversions with saved UPI IDs, auto-fill and a checkout that loads in under 300ms.' },
  ]
  return (
    <section id="features" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Features</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Everything your business needs to move money</h2>
          <p className="mt-4 text-lg text-slate-600">From collections to payouts to compliance — PaySutra is the financial engine behind thousands of growing businesses.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                <Icon d={f.icon} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Create your account', desc: 'Sign up as an individual or an organization — takes under a minute, no paperwork.' },
    { n: '02', title: 'Record & link payments', desc: 'Track incoming collections and outgoing payouts in one dashboard.' },
    { n: '03', title: 'Track & grow', desc: 'Monitor monthly cash flow, customer-wise totals and pending settlements in real time.' },
  ]
  return (
    <section id="how-it-works" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">How it works</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Go live in three simple steps</h2>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative text-center md:text-left">
              <span className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-5xl font-black text-transparent">{s.n}</span>
              <h3 className="mt-3 text-xl font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="pointer-events-none absolute top-8 right-0 hidden w-1/2 border-t-2 border-dashed border-slate-200 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const plans = [
    {
      name: 'Starter', price: 'Free', note: 'Pay per transaction', cta: 'Start for free', highlight: false,
      features: ['Standard 2% per transaction', 'Payment links & QR', 'Next-day settlements', 'Email support'],
    },
    {
      name: 'Growth', price: '₹1,999', note: 'per month + 1.5% per transaction', cta: 'Start 14-day trial', highlight: true,
      features: ['Everything in Starter', 'Instant payouts', 'Auto-reconciliation', 'Priority 24×7 support', 'Custom checkout branding'],
    },
    {
      name: 'Enterprise', price: 'Custom', note: 'Volume-based pricing', cta: 'Talk to sales', highlight: false,
      features: ['Everything in Growth', 'Dedicated success manager', 'Custom SLAs & on-prem options', 'API rate limit uplift'],
    },
  ]
  return (
    <section id="pricing" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Pricing</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Simple pricing that scales with you</h2>
          <p className="mt-4 text-lg text-slate-600">No setup fees. No lock-ins. Cancel anytime.</p>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-8 ${p.highlight ? 'border-2 border-indigo-600 bg-slate-950 shadow-2xl shadow-indigo-200' : 'border border-slate-200 bg-white'}`}>
              {p.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white">MOST POPULAR</span>
              )}
              <h3 className={`text-lg font-bold ${p.highlight ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
              <p className="mt-4 text-4xl font-extrabold">
                <span className={p.highlight ? 'text-white' : 'text-slate-900'}>{p.price}</span>
              </p>
              <p className={`mt-2 text-sm ${p.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{p.note}</p>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-3 text-sm ${p.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                    <Icon d={icons.check} className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${p.highlight ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const items = [
    { quote: 'We moved our entire collections flow to PaySutra in a weekend. Settlement times dropped from T+2 to 18 seconds.', name: 'Ananya Sharma', role: 'CTO, Kwikcart' },
    { quote: 'The auto-reconciliation alone saves our finance team 40 hours a month. It has literally paid for itself.', name: 'Rahul Mehta', role: 'Finance Head, LedgerLy' },
    { quote: 'Checkout success rate went up 9% after switching. For a D2C brand at our scale, that is real money.', name: 'Priya Nair', role: 'Founder, Bloom & Co.' },
  ]
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Testimonials</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Loved by builders across India</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="rounded-2xl bg-slate-50 p-8">
              <div className="mb-4 flex gap-1 text-amber-400">{'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}</div>
              <blockquote className="leading-relaxed text-slate-700">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">{t.name[0]}</span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{t.name}</span>
                  <span className="block text-xs text-slate-500">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const faqs = [
    { q: 'Can I track both personal and organization payments?', a: 'Yes. When you sign up, choose Personal or Organization. Organizations get a shared dashboard with customer-level tracking, payouts and reconciliation.' },
    { q: 'What payment methods does PaySutra support?', a: 'UPI (with Autopay), credit/debit cards, 60+ netbanking banks, major wallets, and card/EMI options for high-ticket purchases.' },
    { q: 'When do I receive settlements?', a: 'Starter plans settle next business day. Growth and Enterprise plans support instant settlements 24×7, including weekends.' },
    { q: 'Is PaySutra RBI-compliant?', a: 'Yes. We operate with partner banks and are fully PCI-DSS Level 1 certified, with data stored only in India.' },
  ]
  const [openIdx, setOpenIdx] = React.useState(0)
  return (
    <section id="faq" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">FAQ</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mt-12 space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white">
              <button onClick={() => setOpenIdx(openIdx === i ? -1 : i)} className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-slate-900">
                {f.q}
                <Icon d={openIdx === i ? icons.minus : icons.plus} className="h-5 w-5 shrink-0 text-indigo-600" />
              </button>
              {openIdx === i && <p className="px-6 pb-5 leading-relaxed text-slate-600">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden bg-slate-950 py-20 md:py-28">
      <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white md:text-5xl">Ready to future-proof your payments?</h2>
        <p className="mt-4 text-lg text-slate-400">Create an account and start tracking payments in under a minute.</p>
        <Link to="/login" className="mt-8 inline-block rounded-xl bg-indigo-500 px-10 py-4 font-semibold text-white transition hover:bg-indigo-400">
          Create free account
        </Link>
        <p className="mt-4 text-xs text-slate-500">Free forever plan available · No credit card required</p>
      </div>
    </section>
  )
}

function Footer() {
  const cols = [
    { title: 'Product', links: ['Payments', 'Payouts', 'Checkout', 'Reconciliation'] },
    { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
    { title: 'Resources', links: ['Docs', 'API Reference', 'Status', 'Help Centre'] },
    { title: 'Legal', links: [{ label: 'Privacy', to: '/privacy' }, 'Terms', 'Compliance', 'Security'] },
  ]
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 font-black">₹</span>
              <span className="font-bold">PaySutra</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">Smart payments infrastructure for modern India.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-bold text-white">{c.title}</h4>
              <ul className="mt-4 space-y-2">
                {c.links.map((l) => {
                  const label = typeof l === 'string' ? l : l.label
                  const to = typeof l === 'string' ? '#' : l.to
                  return (
                    <li key={label}>
                      {to === '#' ? (
                        <a href="#" className="text-sm text-slate-500 transition hover:text-white">{label}</a>
                      ) : (
                        <Link to={to} className="text-sm text-slate-500 transition hover:text-white">{label}</Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 md:flex-row">
          <p>© 2026 PaySutra Technologies Pvt. Ltd. All rights reserved.</p>
          <p>Built in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="bg-white">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
