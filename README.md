# 💳 PaySutra

A fintech landing page + working payment dashboard, built with **React + Vite + Tailwind CSS v4**.

PaySutra lets you sign up as a **Personal** or **Organization** account and actually *use* it — record, track and manage payments, payouts, customers and more. All data lives locally in your browser (localStorage), so nothing leaves your device.

---

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

Sign up on `/login` with any email — the app seeds itself with ~2 weeks of demo transactions so the dashboard is immediately useful.

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

## ⚠️ Note

This is a **demo application** — no real payments are processed and data is not synced to a server. It's ideal as a UI/UX prototype, a portfolio piece, or a starting point for wiring a real payments backend.

---

Made by [ParthSingh112](https://github.com/ParthSingh112) · Built in India 🇮🇳
