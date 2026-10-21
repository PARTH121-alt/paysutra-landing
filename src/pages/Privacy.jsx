import React from 'react'
import { Link } from 'react-router-dom'

const H = ({ children }) => <h2 className="mt-10 text-xl font-bold text-slate-900">{children}</h2>
const P = ({ children }) => <p className="mt-3 leading-relaxed text-slate-600">{children}</p>
const LI = ({ children }) => <li className="mt-2 leading-relaxed text-slate-600">{children}</li>

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-950 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black">₹</span>
            <span className="text-xl font-bold tracking-tight">Pay<span className="text-indigo-400">Sutra</span></span>
          </Link>
          <Link to="/" className="text-sm text-slate-300 hover:text-white">← Back to site</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Legal</p>
        <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="mt-3 text-slate-500">Effective date: October 21, 2026 · Applies to all PaySutra accounts (Personal &amp; Organization)</p>

        <P>
          PaySutra (&quot;we&quot;, &quot;our&quot;, the &quot;Platform&quot;) is a payments tracking demo application. This
          policy explains, in plain language, exactly what information the Platform handles, where it lives, who can see
          it, and how you stay in control of it. By creating an account or using the dashboard, you agree to this policy.
        </P>

        <H>1. Summary in 30 seconds</H>
        <ul className="mt-3 list-disc pl-6">
          <LI>All transaction, payment-request, QR and team data is stored <strong>locally in your own browser</strong> (browser localStorage) — it is not sent to or stored on our servers.</LI>
          <LI>We <strong>never collect your bank account numbers, card numbers, UPI PIN or passwords</strong>. The Platform has no ability to see or move money.</LI>
          <LI>Payments are initiated through <strong>standard UPI intent links</strong>; the actual money movement happens entirely inside your bank/UPI app (GPay, PhonePe, Paytm, BHIM, etc.).</LI>
          <LI>Your data is <strong>segregated per account</strong> — a Personal account and an Organization account on the same device have completely separate books.</LI>
          <LI>You can export (CSV), or permanently erase, all of your data at any time from Settings.</LI>
        </ul>

        <H>2. Information we collect</H>
        <P>PaySutra processes the following categories of information, all of which you provide directly:</P>
        <ul className="mt-3 list-disc pl-6">
          <LI><strong>Account information:</strong> email address, display name, account type (Personal or Organization) and, for organizations, the organization name and the admin's name. If you sign up with Google, your Google account name and email are received as part of the standard Google Sign-In response.</LI>
          <LI><strong>Transaction records you create:</strong> counterparty names, amounts, dates, payment method labels (UPI/card/netbanking/NEFT/wallet), notes, and statuses (completed/pending/failed/cancelled).</LI>
          <LI><strong>Payment requests you send:</strong> the counterparty, amount, note, and the UPI ID (VPA) involved — this is required to build the UPI payment link.</LI>
          <LI><strong>Payment QR data:</strong> images you upload to the QR vault, and the UPI ID decoded from them (or entered manually). Uploaded images are stored locally as base64 text in your browser only.</LI>
          <LI><strong>Team data (Organizations only):</strong> the names, emails and roles of teammates you invite, so they can sign in with role-based access.</LI>
          <LI><strong>Technical information:</strong> nothing is collected automatically. We do not use cookies for tracking, analytics, advertising or profiling in this demo.</LI>
        </ul>

        <H>3. What we do NOT collect</H>
        <ul className="mt-3 list-disc pl-6">
          <LI>Bank account numbers, IFSC codes, UPI PINs, card numbers, CVV, or any password — for you or your clients.</LI>
          <LI>Your clients' financial information. When a client pays you through a UPI link you generated, the exchange happens entirely between their UPI app and your bank; PaySutra never sees it.</LI>
          <LI>Device fingerprints, advertising identifiers, or behavioural profiles.</LI>
        </ul>

        <H>4. Where your data is stored</H>
        <P>
          Everything you record in PaySutra is saved in your browser's <strong>localStorage</strong>, on your device,
          under keys namespaced to your account email (for example, transaction data is stored separately per account
          email). This means:
        </P>
        <ul className="mt-3 list-disc pl-6">
          <LI>No data leaves your device unless you personally choose to share it (e.g. clicking &quot;Share on WhatsApp&quot;).</LI>
          <LI>Live sync works between open tabs/windows <em>of the same browser profile</em> — not across devices — because there is no server.</LI>
          <LI>Clearing your browser's site data, or using another browser/device, will not show your records there.</LI>
        </ul>

        <H>5. How payments work (and what we can and cannot see)</H>
        <P>
          When you create a payment request, PaySutra builds a standard <strong>UPI intent link</strong>
          (<code className="rounded bg-slate-100 px-1 py-0.5 text-sm">upi://pay?pa=…&amp;pn=…&amp;am=…</code>) containing only the
          destination UPI ID, the payee name, the amount and the note. Scanning or opening that link opens the payer's
          own UPI application, where <strong>their bank or UPI provider processes the payment directly</strong>.
        </P>
        <ul className="mt-3 list-disc pl-6">
          <LI>We do not participate in, observe, or verify the payment. We cannot tell whether money actually moved.</LI>
          <LI>Marking a request as &quot;received&quot; or &quot;paid&quot; is a <strong>manual confirmation by you</strong> and simply records it in your books.</LI>
          <LI>If you integrate a payment gateway in a future version, this policy will be updated to describe the gateway's additional data processing before any such feature goes live.</LI>
        </ul>

        <H>6. Third-party services</H>
        <ul className="mt-3 list-disc pl-6">
          <LI><strong>Google Sign-In (optional):</strong> if you choose &quot;Sign up with Google&quot;, authentication is handled by Google LLC under their own privacy policy. We receive only your profile name and email from the OAuth response; we receive nothing about your contacts, drive, or Gmail. If Google Sign-In is not configured by the site operator, the fallback account chooser runs entirely in your browser and no data reaches Google.</LI>
          <LI><strong>WhatsApp sharing (only when you click it):</strong> the &quot;Share on WhatsApp&quot; button opens WhatsApp with a payment message you initiated. What you share is what you chose to share.</LI>
          <LI><strong>Hosting:</strong> the application is hosted on Vercel, which serves the application files. Because all user data stays in the browser, the hosting provider does not receive your transaction data.</LI>
        </ul>

        <H>7. Role-based access in organizations</H>
        <P>
          When an organization invites teammates, the invited person can sign in with their invited email and receive
          one of four roles: <strong>Admin, Finance, Operations, or Viewer</strong>. Each role limits which pages the
          teammate can open and whether they can record or edit payments (e.g. a Viewer can look at transaction history
          but cannot add, delete, or approve anything). Owners are responsible for inviting the right people with the
          right roles and removing access when someone leaves — you can remove members at any time from the Team page.
        </P>

        <H>8. Your rights and controls</H>
        <ul className="mt-3 list-disc pl-6">
          <LI><strong>Access &amp; export:</strong> export all of your transactions to CSV from the Transactions page at any time.</LI>
          <LI><strong>Correction:</strong> edit your profile (name/organization name) in Settings; edit or delete any transaction record.</LI>
          <LI><strong>Erasure:</strong> &quot;Erase all data&quot; in Settings permanently deletes all transactions, payment requests, your QR vault and your organization's team invites from the browser. You can also clear site data from your browser settings at any time.</LI>
          <LI><strong>Withdraw consent:</strong> signing out stops the Platform from reading or writing your data. Nothing is processed while you are not using the app.</LI>
        </ul>

        <H>9. Security</H>
        <P>
          Because no data is transmitted or stored server-side, the primary security boundary is your device and
          browser profile. We recommend using PaySutra on a personal device, not on shared/public computers, and
          signing out after use. Uploaded QR images are handled entirely in your browser's memory and storage. No
          encryption of localStorage beyond your browser's default sandboxing is applied in this demo — treat the app
          as a prototype and do not use it as a replacement for your bank's records or accounting software.
        </P>

        <H>10. Children</H>
        <P>PaySutra is intended for individuals and businesses tracking their own payments. It is not directed at children under 13, and we do not knowingly process data of children.</P>

        <H>11. Changes to this policy</H>
        <P>
          If the Platform gains server-side features (cloud sync, payment gateways, verification webhooks), this policy
          will be updated and the effective date above will change before those features are enabled. Continued use of
          the Platform after an update constitutes acceptance of the revised policy.
        </P>

        <H>12. Contact</H>
        <P>
          Questions about this policy or your data? Open an issue on the project repository or write to the account
          owner at <strong>technoxian543@gmail.com</strong>.
        </P>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          PaySutra is a demo application. It does not process, hold, or transfer real payments, and nothing in this
          document should be read as banking, legal, or tax advice.
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">paysutra-landing</Link> · © 2026 PaySutra Technologies
      </footer>
    </div>
  )
}
