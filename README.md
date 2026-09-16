# Meridian Bank

Precision banking for people who count. Meridian is a full banking application:
person-to-person transfers, three account types, merchant purchases, bill
payments, autopilot debit orders — all settled on an immutable, row-locked
ledger in PostgreSQL.

Currency is **South African Rand (ZAR)**.

> ⚠️ **Demonstration build.** Not a real bank. No real deposits, no FDIC,
> no card networks. Balances exist to demonstrate the mechanics.

---

## Features

### Money movement
- **Person-to-person transfers** — search members by name or email, pick
  *their* account, send. Instant, fee-free, settled atomically.
- **Buy from 12 partner merchants** — Makro, Checkers, Takealot, Game,
  Dis-Chem and more, including **Vodacom / MTN airtime & data** (credited
  instantly). Any custom store name works too.
- **Pay bills** — registered billers with biller codes and due dates
  (Eskom, City of Cape Town, Netflix, Boxer Fibre, FNB Home Loan…), plus a
  custom-biller form for anything else.
- **Debit orders (autopilot)** — mandate any merchant at a weekly or monthly
  cadence. Due mandates **settle automatically** against your account with a
  row-level lock, post a referenced ledger entry, and advance the schedule.
  Pause, resume, or cancel any mandate before its run date.

### Accounts
| Type | Behaviour |
|---|---|
| **Checking** | Everyday money. Instant transfers, R0 fees. |
| **Savings** | 3.20% APY, compounded daily (displayed, not yet accrual-settled). |
| **Credit line** | R5,000 instant line — balance can go negative down to the limit; usage is shown as a bar. |

Members hold one of each type, up to four accounts total. New members choose
their starting account at signup and receive a **R250 welcome credit** posted
to the ledger immediately.

### Roles
- **Customer** — full member experience: dashboard, transfers, buy, bills,
  debit orders, accounts, activity.
- **Administrator** — everything a customer has (admins bank from their own
  treasury accounts) **plus** the Admin Console: every registered user, all
  their accounts and balances, last activity, a per-user ledger drill-down,
  and a live "latest system movements" feed.

> **The administrator can only be created by the database seed.**
> The registration endpoint hardcodes `role: "CUSTOMER"` — there is no code
> path that can mint an admin.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + React 19 |
| Database | PostgreSQL |
| ORM | **Prisma** (client generated via `prisma-client-js`) |
| Auth | Custom — `bcryptjs` password hashing + `jose` HS256 JWTs in an httpOnly cookie (7-day sessions) |
| Styling | Tailwind CSS v4, custom theme (Fraunces / Instrument Sans / IBM Plex Mono) |
| Currency | ZAR via `Intl.NumberFormat` (narrow "R" symbol) |

---

## Getting started

### Prerequisites
- Node.js 20+
- A running PostgreSQL instance (local or hosted)

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@127.0.0.1:5432/app_db` |
| `AUTH_SECRET` | dev-optional | HMAC secret for session JWTs. Falls back to a dev value when empty; **set it in production** (`openssl rand -hex 32`). Rotating it logs everyone out. |

### 3. Create the schema

```bash
npx prisma generate   # Prisma client (also runs on install)
npx prisma db push    # create tables from prisma/schema.prisma
```

### 4. Seed the database

```bash
npx prisma db seed
```

Seeding is configured in `prisma.config.ts` (`migrations.seed`) and is the
**only way the administrator account exists**. The seed creates:

- 1 admin (Meridian Treasury, ~R1.96M across two accounts)
- 7 default customers defined in the `SEED_USERS` block of `prisma/seed.ts`
- ~60 historical ledger entries (transfers, opening deposits, welcome credits)
- 9 debit-order mandates — **one of Amara's is already overdue**, so the
  first time she logs in, autopilot settles it live

Reseeding wipes and rebuilds all data (and invalidates existing sessions).

> Prefer an `npm run seed` shortcut? Add
> `"scripts": { "seed": "prisma db seed" }` to `package.json` — the
> behaviour is identical to `npx prisma db seed`.

### Creating your own default users

All default users live in one declarative block at the top of
[`prisma/seed.ts`](prisma/seed.ts) — edit it and reseed:

```ts
const SEED_USERS: SeedUserSpec[] = [
  // …existing demo users…

  {
    name: 'Thabo Mokoena',
    email: 'thabo@example.com',
    password: 'demo1234',
    ageDays: 10,                      // signed up 10 days ago
    accounts: ['CHECKING', 'SAVINGS'],// CREDIT adds a R5,000 line
    openingDeposit: 7_500,            // omit → random R1,800–R24,000
    mandates: [                       // optional debit orders
      { merchant: 'Netflix', amount: 199, frequency: 'MONTHLY', dueInDays: 6 },
      // dueInDays: -0.1 → overdue, settles live on their first login
    ],
  },
];
```

| Field | Required | Meaning |
|---|---|---|
| `name`, `email`, `password` | ✅ | Login credentials (password is bcrypt-hashed) |
| `ageDays` | ✅ | How long the membership looks established (drives join date & history) |
| `accounts` | – | Which accounts to open; default `['CHECKING', 'SAVINGS']` |
| `openingDeposit` | – | Fixed R amount wired in from admin treasury; omit for a random realistic one |
| `mandates` | – | Debit orders to register; each gets its own schedule and can be pre-overdue |

Every user also automatically receives the R250 welcome credit, and
inter-user history is generated across the seeded population so ledgers look
alive. Then:

```bash
npx prisma db seed
```

Notes:

- **Wipe semantics** — reseeding deletes and rebuilds *everything*, including
  any accounts registered through the app. Existing sessions stop working.
- **Admins** — the admin is created outside `SEED_USERS` and always exists
  after a seed; the app itself can never create one.
- **Emails** must be unique (Postgres unique constraint) — duplicate emails
  will fail the seed.

### 5. Run

```bash
npm run dev      # development
npm run build && npm start   # production
```

---

## Demo logins

| Role | Email | Password |
|---|---|---|
| **Administrator** (seed-only) | `admin@meridian.com` | `admin1234` |
| Customer | `amara@demo.com` | `demo1234` |
| Customer | `jonas@demo.com` | `demo1234` |
| Customer | `priya@demo.com` | `demo1234` |
| Customer | `diego@demo.com` | `demo1234` |
| Customer | `grace@demo.com` | `demo1234` |
| Customer | `tom@demo.com` | `demo1234` |
| Customer | `lena@demo.com` | `demo1234` |

Sign in as **Amara** to see the autopilot banner (her overdue Netflix mandate
settles on first load), or as the **admin** to watch every movement on the
system.

---

## How money moves

Every balance-changing operation (transfer, purchase, bill, debit-order run)
follows the same pattern:

1. The acting account row is locked:
   `SELECT id FROM "accounts" WHERE id = … FOR UPDATE`
   (multi-account transfers lock both rows in id order to avoid deadlocks).
2. Available funds are re-read **under the lock**
   (`balance + creditLimit`) and validated.
3. Balances are adjusted and the transaction is written — all inside one
   Prisma interactive transaction (`$transaction`), so it is all-or-nothing.
4. Each entry gets a unique immutable reference (`MDB-XXXXXX-XX`).

Concurrent overdrafts are therefore impossible, and every member's balance is
exactly explainable by their ledger.

### Debit-order autopilot
`GET /api/debit-orders` doubles as the daily batch: any `ACTIVE` mandate
whose `nextRun` has arrived is settled in place (locked, referenced,
schedule advanced). If the account can't cover it, the cycle is skipped.
Clients surface settlements via the "Autopilot ran" banner and resynced
balances.

### Authentication
- Login/register hash passwords with bcrypt (10 rounds) and sign an HS256 JWT
  (`jose`) carrying `sub`, `role`, `email` — 7-day expiry.
- The JWT lives in an `httpOnly`, `SameSite=Lax` cookie (`meridian_session`).
- Server components gate `/app` (any user) and `/admin` (ADMIN only); every
  API route re-verifies the session, and admin routes re-check the role.

---

## API reference

All routes return JSON. Auth routes set/clear the session cookie.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create a **customer** account + starting account + R250 welcome credit. Sets session. |
| POST | `/api/auth/login` | — | Verify credentials. Sets session. |
| POST | `/api/auth/logout` | — | Clears session. |
| GET | `/api/me` | user | Current user + accounts. |
| POST | `/api/accounts` | user | Open a new account (one per type, max 4). |
| GET | `/api/transactions` | user | Current user's ledger (last 80), with direction & counterparty. |
| POST | `/api/transactions` | user | Person-to-person transfer (row-locked, atomic). |
| GET | `/api/users/search?q=` | user | Search members by name/email (excludes self), with their accounts. |
| POST | `/api/purchase` | user | Buy from a merchant (partner or custom). |
| POST | `/api/bills` | user | Pay a biller (preset or custom, with biller code). |
| GET | `/api/debit-orders` | user | List mandates; **settles any due runs first** (autopilot). |
| POST | `/api/debit-orders` | user | Create a mandate (merchant, amount, WEEKLY/MONTHLY, first run, source account). |
| PATCH | `/api/debit-orders/:id` | user | `{ action: "pause" \| "resume" \| "cancel" }`. |
| GET | `/api/admin/users` | **admin** | All users + accounts + balances, system stats, latest movements. |
| GET | `/api/admin/users/:id` | **admin** | One user's accounts and last 15 ledger entries. |
| GET | `/api/health` | — | Liveness probe. |

Transaction kinds: `TRANSFER`, `CREDIT`, `PURCHASE`, `BILL`, `DEBIT_ORDER`.

---

## Pages

| Path | Access | What you get |
|---|---|---|
| `/` | public | Marketing page with live DB stats (redirects to `/app` when signed in) |
| `/login`, `/register` | public | Auth (one-click demo-credential fill on login) |
| `/app` | any user | Member dashboard: Overview, Send money, Buy, Pay bills, Debit orders, Accounts, Activity |
| `/admin` | admin only | Admin Console: stats, full member directory, per-user drill-down, live system feed |

---

## Project structure

```
prisma/
  schema.prisma          # users, accounts, transactions, debit_orders
  seed.ts                # the ONLY place an admin is created
prisma.config.ts         # Prisma CLI config (env loading + seed command)
src/
  app/
    page.tsx             # landing
    login/ register/     # auth pages (session-gated)
    app/                 # member dashboard gate
    admin/               # admin console gate (role-checked)
    api/                 # route handlers (see API reference)
  components/
    dashboard/           # Dashboard, TransferForm, BuyPanel, BillsPanel,
                         # DebitOrdersPanel, AccountsPanel, ActivityList
    admin/               # AdminConsole
    icons.tsx ui.tsx motion.tsx   # design system + signature motion
  lib/
    prisma.ts            # Prisma client singleton
    auth.ts              # JWT sign/verify, cookie helpers, getSessionUser
    bank.ts              # references, account numbers, amount sanitising
    commerce.ts          # merchant + biller catalog, schedule math
    format.ts            # ZAR money/date formatting, labels
    types.ts api.ts      # shared types + serialization (toTxView)
```

## Data model

```
User 1──* Account 1─* Transaction *──1 User (sender/receiver)
User 1─* DebitOrder 1─* Transaction (runs)
Account 1─* DebitOrder (source)
Transaction.counterparty  ← merchant / biller name for PURCHASE | BILL | DEBIT_ORDER
```

Amounts are `Decimal(15,2)`; every account has a `creditLimit` (non-zero only
for the CREDIT type) so "available funds" is always `balance + creditLimit`.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npx prisma db push` | Sync schema → database |
| `npx prisma db seed` | Wipe + rebuild demo data (incl. the only admin) |
| `npx prisma studio` | Browse data in Prisma Studio |
