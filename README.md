# LoanLedger — Modern Indian Loan Website

A production-style **loan-website platform** built with **React + Vite** and an **Express** API backed by **TiDB (MySQL)**.

> **Sandbox note:** this deployment runs in **sandbox mode** — the full product workflow is live (applications, statuses, checkout, admin), but the payment gateway is simulated and **no live funds are transferred**. Nothing on the site claims RBI/government approval, and the site never asks for card, UPI or banking credentials.

---

## 1. Project structure

```
lone/
├── frontend/          React + Vite client
│   ├── src/           pages, components, contexts, helpers
│   ├── public/        static assets
│   ├── index.html
│   ├── vite.config.js (dev proxy: /api + /uploads -> :3001)
│   └── .env           VITE_* browser config
├── backend/           Express API
│   ├── server/        app entry, routes, DB, auth, seed
│   ├── scripts/       content refresh + API smoke test
│   └── .env           secrets + database config (gitignored)
└── package.json       npm workspaces + combined dev scripts
```

## 2. Quick start

```bash
npm install                              # installs both workspaces (once)
cp backend/.env.example backend/.env     # then fill in your database values
npm run dev                              # starts BOTH backend (3001) and frontend (5173)
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` to the backend automatically.

Each side can also be run on its own with `cd frontend && npm install && npm run dev`
or `cd backend && npm install && npm run dev`.

| Script | What it does |
|---|---|
| `npm run dev` | Backend + frontend together |
| `npm run dev:server` | Express API only (`:3001`) |
| `npm run dev:client` | Vite frontend only (`:5173`) |
| `npm run build` | Production build to `frontend/dist/` |
| `npm run preview` | Preview the production build |
| `npm run refresh` | Re-sync DB content (plans, FAQs, chatbot, wording) with the code |

## 3. Environment

Backend — `backend/.env` (copy from `backend/.env.example`):

```env
PORT=3001
DATABASE_URL=mysql://USER:PASSWORD@host:4000/loanledger_demo
JWT_SECRET=a-long-random-string
ADMIN_EMAIL=admin@loanledger.demo
ADMIN_PASSWORD=
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend — `frontend/.env` (copy from `frontend/.env.example`):

```env
VITE_UPI_VPA=your-upi-id@bank
VITE_UPI_PAYEE=Your Name
```

- **DATABASE_URL** — TiDB Cloud / MySQL connection string. Use a *dedicated* database (e.g. `loanledger_demo`); the reserved `sys` schema rejects DDL.
- **ADMIN_EMAIL / ADMIN_PASSWORD** — the initial admin is created from these on first boot. If the password is blank, a strong random one is printed **once** to the server console. **No password is hardcoded in the repo.**
- `.env` is gitignored. Never commit real credentials.

## 4. Seeded logins

| Role | Email | Password |
|---|---|---|
| Customer | `demo.customer@loanledger.demo` | `Demo@1234` |
| Customer | `demo.customer2@loanledger.demo` | `Demo@1234` |
| Admin | `admin@loanledger.demo` | value of `ADMIN_PASSWORD` |

Logging in with **admin credentials on the regular Login page** redirects straight to the admin panel.

## 5. What's inside

### Public site (single home page with sections)
Hero ("Find the Right Loan for You" + Apply Now / Check Eligibility) → Loan Plans (low→high) → Eligibility checker → How It Works → Features → About → Stats → FAQ → Support → CTA → **Contact form**. Plus a floating assistant.

### Legal pages
`/legal` hub with **Privacy Policy** (`/privacy`), **Terms & Conditions** (`/terms`), **Disclaimer** (`/disclaimer`), **Fair Practice** (`/fair-practice`) and **Grievance Redressal** (`/grievance`). The DocLayout carries a calm sandbox disclosure.

### Customer
- Register / login (bcrypt-hashed passwords, JWT sessions)
- Multi-step application: personal → address → employment → loan → documents → review (server-validated, save-and-continue)
- Secure checkout (UPI / Net Banking / Card selection — **no credential fields**; sandbox gateway)
- Dashboard: welcome, reference number, status timeline, document status, payment history, active plans, notifications, support tickets, profile, logout

### Admin (server-side role protected)
Stats from live DB records · users · applications (search by ref, status changes, internal notes, customer notifications) · plan manager (amounts & processing fees) · payments · support tickets · FAQ manager · chatbot knowledge base · contact messages · company settings.

## 6. Loan plans (template values)

| Plan | Loan amount | Processing fee |
|---|---|---|
| C — Micro Ease | up to ₹10,000 | ₹250 |
| A — Quick Start | up to ₹30,000 | ₹499 |
| B — Flexi Plus | up to ₹1,00,000 | ₹1,499 |

Displayed **low → high**. All are configurable from Admin → Loan Plans.

## 7. Application statuses
`Draft → Submitted → Under Review → Additional Information Required → Completed`

Reference numbers use the `LN-YYYY-#####` format.

## 8. Tech notes

- **Backend:** `backend/server/` — Express, `mysql2` pool with TLS, bcryptjs password hashing, JWT auth, multer uploads (local, 2 MB, image/pdf/txt). Uploads live in `backend/server/uploads/`.
- **Frontend:** `frontend/src/` — React 18, React Router v7, lucide-react icons, hand-rolled design system in `frontend/src/index.css` (navy + teal, white background, responsive).
- **Production:** `npm run build` outputs `frontend/dist/`; the Express server serves that build (and the API) from one origin. Override the location with `FRONTEND_DIST` if needed.
- **Security:** admin routes require the `admin` role server-side; ownership checks on all customer records; server-side validation on every form; no plaintext passwords; uploaded documents are stored on the application server only.
- **Reset / refresh data:** `npm run refresh` re-syncs plans, FAQs, chatbot KB, settings and row wording with the code. To fully reset, drop/recreate the schema — schema, plans, FAQs, chatbot entries, sample users and admin are recreated on next start.

## 9. Integrity guardrails

- Sandbox disclosures live where they matter: legal pages (calm banner), document-upload step, and payment success — no fake government/RBI approval claims anywhere
- Checkout never asks for card numbers, CVV, UPI PINs, banking passwords or OTPs
- No "guaranteed approval" or disbursal claims; statuses describe workflow, not credit decisions
- Contact details and plans are admin-configurable; nothing customer-facing is hard-coded
