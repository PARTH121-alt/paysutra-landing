# 💳 PaySutra

A fintech landing page + working payment dashboard, built with **React + Vite + Tailwind CSS v4**.

PaySutra lets you sign up as a **Personal** or **Organization** account and actually *use* it — record, track and manage payments, payouts, customers and more. All data lives locally in your browser (localStorage), so nothing leaves your device.

---
live on:-https://paysutra-landing.vercel.app/

## ✨ Features

### Marketing site (`/`)
- Animated hero with floating gradient blobs and a live-looking dashboard mockup
- Stats bar, feature grid, how-it-works, pricing, testimonials, FAQ (accordion), CTA & footer
- Sticky glassy navbar with mobile menu

### Authentication (`/login`)
- **Sign in** with an existing email account, or **Create account**
- Choose **Personal** (your own payments) or **Organization** (for a business)
- **Sign up with Google** (personal accounts only)
  - Works out of the box with a Google-style account chooser
  - Fully real Google OIDC Sign-In if you set `VITE_GOOGLE_CLIENT_ID` (see below)

### Personal dashboard
| Page | What you can do |
|---|---|
| Overview | Balance, total in/out bar chart (last 6 months), recent activity |
| Payments | Search, filter, record money-in/out, mark pending complete/failed, delete, export CSV |
| Contacts | People & merchants grouped with collected / paid / net totals |
| Settings | Edit profile, reset to demo data |

### Organization dashboard (separate experience)
| Page | What you can do |
|---|---|
| Overview | Organization-wide cash flow |
| Transactions | Vendor & customer payments with approval workflow |
| Payouts | Schedule payouts to vendors/employees, approve & settle, settled/pending/failed totals |
| Customers | Customer & vendor cards with collected vs paid and payment methods used |
| Team | Invite teammates by email with roles (Admin / Finance / Operations / Viewer), remove members |
| Settings | Org profile management |

---

## 🚀 Getting started

```bash
# 1. install dependencies
npm install

# 2. start the dev server
npm run dev
# → http://localhost:5173

# 3. production build + preview
npm run build
npm run preview
```

Sign up on `/login` with any email — **new accounts start completely empty** (no demo data). Record your first payment to start seeing analytics.

### 👥 Role-based access control (RBAC)

Organization owners are **Admin**. Teammates invited on the Team page get a role, and can then **sign in with their invited email** — the dashboard adapts to their access level:

| Role | Pages | Can write? |
|---|---|---|
| **Admin** (owner) | All pages + Team + Settings | ✅ Full |
| **Finance** | Overview, Transactions, Payouts, Customers | ✅ Full |
| **Operations** | Overview, Transactions, Payouts, Customers | ✅ Full |
| **Viewer** | Overview, Transactions, Customers | ❌ Read-only |

Route-level guards redirect unauthorized roles to the Overview, and write UI (buttons/mark actions) is hidden for read-only users.

---

## 🔐 Optional: real Google Sign-In

The "Sign up with Google" button works in demo mode by default. To make it a real OAuth flow:

1. Create an OAuth 2.0 **Web** client at [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Add `http://localhost:5173` to its **Authorized JavaScript origins**
3. Copy `.env.example` to `.env` and set:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
4. Restart the dev server — the login page will render Google's official blue button.

---

## 📦 Tech stack

| | |
|---|---|
| Framework | React 18 |
| Bundler | Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | React Router v6 (nested dashboard routes) |
| State | React Context + localStorage persistence |

## 🗂 Project structure

```
src/
├── main.jsx                 # entry
├── App.jsx                  # routes (/, /login, /app/*)
├── store.jsx                # auth + transactions + members (Context, localStorage)
├── index.css                # Tailwind + custom animations
├── pages/
│   ├── Landing.jsx          # marketing site
│   └── Login.jsx            # sign in / create account / Google
└── components/
    ├── icons.jsx            # inline SVG icon set
    ├── ui.jsx               # PageHead, Card, StatusBadge, EmptyState
    ├── DashboardLayout.jsx  # sidebar (adapts to personal/organization)
    ├── Overview.jsx         # stats + cash-flow chart
    ├── Transactions.jsx     # full CRUD + filters + CSV export
    ├── Payouts.jsx          # schedule & approve payouts
    ├── Customers.jsx        # party-wise aggregation
    ├── Team.jsx             # org-only member management
    └── Settings.jsx         # profile + data controls
```

## 🟢 Going to production (real money, real accounts)

The app ships **dual-mode**: without any keys it runs as the localStorage demo; add the keys below and every feature becomes genuinely live — real accounts, server data, cross-device realtime, and Razorpay payments.

### 1) Supabase — backend, auth & live sync

1. Create a free project → [supabase.com](https://supabase.com)
2. SQL Editor → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**
3. Project Settings → API → copy values into `.env`:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (used only by the serverless webhook)
4. *(Optional)* Authentication → Providers → **Google** → enable with your Google OAuth client (Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`) → "Sign up with Google" becomes a real OAuth flow right away
5. For production sign-ups, disable "Confirm email" (Auth → Sign In/Up) or implement the confirmation redirect

### 2) Razorpay — real payments

1. Create an account → [razorpay.com](https://razorpay.com) — test with **Test Mode** (free)
2. Add env vars: `VITE_RAZORPAY_KEY_ID` (client), `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (server)
3. Deploy, then in Razorpay Dashboard → **Webhooks** add `https://<your-domain>/api/webhook` with events `payment_link.paid` + `payment.captured`, and put the generated secret in `RAZORPAY_WEBHOOK_SECRET`
4. Now: clients receive **real Razorpay payment links** (payable by UPI/card/netbanking), the webhook **server-verified-ly** records the payment on your books, and "Pay now" opens **real Razorpay Checkout** for money out

### 3) Deploy with keys

```bash
vercel env add ...   # or set them in the Vercel dashboard
vercel --prod
```

Server-only keys (`RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_WEBHOOK_SECRET`) are used exclusively inside `/api/*` serverless functions and are never bundled into client JavaScript.

---

Made by [PARTH121-alt](https://github.com/PARTH121-alt) · Built in India 🇮🇳
