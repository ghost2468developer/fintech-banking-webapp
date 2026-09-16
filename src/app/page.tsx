import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { CountUp, LedgerFeed, Marquee, Reveal, Scramble } from "@/components/motion";
import {
  IconArrowRight,
  IconCheck,
  LogoMark,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const TICKER = [
  "Checking · unlimited instant transfers",
  "Savings · 3.20% APY, compounded daily",
  "Credit line · R5,000 instant",
  "Welcome credit · R250",
  "Pay bills · Eskom to Netflix, one tap",
  "Debit orders · autopilot on your schedule",
  "12 shop partners · Makro, Takealot & more",
  "Airtime · Vodacom & MTN, credited instantly",
  "Settlement · median 42ms",
  "Ledger · immutable, signed, referenced",
];

const FEED = [
  { a: "Amara Okafor", b: "MDB-K4F2X9 · checking", amt: "924.55", sign: 1 as const },
  { a: "Jonas Weber", b: "MDB-7QPLM3 · savings", amt: "200.00", sign: -1 as const },
  { a: "Grace Chen", b: "MDB-9XDRT2 · checking", amt: "1,240.00", sign: 1 as const },
  { a: "Priya Sharma", b: "MDB-2WVN8C · credit line", amt: "86.20", sign: -1 as const },
  { a: "Diego Ramírez", b: "MDB-5HKBA1 · checking", amt: "350.75", sign: 1 as const },
  { a: "Lena Kowalski", b: "MDB-8MCQD4 · checking", amt: "412.90", sign: -1 as const },
];

const STEPS = [
  {
    n: "01",
    label: "Open an account",
    title: "Thirty seconds, no paperwork",
    body: "Name, email, password. Your checking account is live immediately with a R250 welcome credit already posted to the ledger. No branch, no waiting, no fine print to drown in.",
  },
  {
    n: "02",
    label: "Find someone",
    title: "People, not account numbers",
    body: "Search by name or email. Pick the person, pick their account, type the amount. The transfer settles instantly — row-locked, atomic, and fee-free in both directions.",
  },
  {
    n: "03",
    label: "Watch the ledger",
    title: "Every line, on the record",
    body: "Each movement carries a unique reference visible to both parties, forever. Balances reconcile themselves because there is only one source of truth under the hood.",
  },
];

export default async function LandingPage() {
  const session = await getSessionUser();
  if (session) redirect("/app");

  const [userCount, accountCount, volRow, fundsRow] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.$queryRaw<{ s: number | null }[]>`
      SELECT COALESCE(SUM("amount"), 0) AS s
      FROM "transactions"
      WHERE "kind" = 'TRANSFER' AND "createdAt" > NOW() - INTERVAL '30 days'`,
    prisma.$queryRaw<{ s: number | null }[]>`
      SELECT COALESCE(SUM("balance"), 0) AS s FROM "accounts"`,
  ]);

  const volume30 = Number(volRow[0]?.s ?? 0);
  const totalFunds = Number(fundsRow[0]?.s ?? 0);

  return (
    <div className="min-h-screen">
      {/* ---------------- header ---------------- */}
      <header className="sticky top-0 z-40 border-b border-ink/12 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="size-7 text-ink" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Meridian
            </span>
            <span className="mono -ml-1.5 text-[10px] uppercase tracking-[0.3em] text-ink/45">
              Bank
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink/65 md:flex">
            <a href="#how" className="transition-colors hover:text-ink">
              How it settles
            </a>
            <a href="#accounts" className="transition-colors hover:text-ink">
              Account types
            </a>
            <a href="#integrity" className="transition-colors hover:text-ink">
              Integrity
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-md border border-ink/25 px-4 text-sm font-semibold transition-colors hover:border-ink hover:bg-ink/5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-ink bg-lime px-4 text-sm font-semibold shadow-[2px_2px_0_rgba(13,21,18,0.9)] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_rgba(13,21,18,0.9)]"
            >
              Open an account
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13,21,18,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(13,21,18,0.055) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 90% 70% at 50% 20%, black 30%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pb-20 pt-14 lg:grid-cols-12 lg:gap-8 lg:pt-20">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5 flex items-center gap-2 text-ink/50">
              <span className="inline-block size-1.5 rounded-full bg-limedeep" />
              Meridian Bank · person-to-person ledger
            </p>
            <h1 className="font-display text-[2.9rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.4rem]">
              Every cent,
              <br />
              <span className="text-ink">
                <Scramble text="accounted for." />
              </span>
              <span className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.1em] bg-limedeep" />
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink/65">
              Meridian is a bank built for the whole job: person-to-person
              transfers, buying from 12 partners, paying Eskom to Netflix, and
              debit orders that run themselves — all on three account types and
              an immutable, row-locked ledger behind every single line.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link href="/register" className="btn-primary">
                Open an account
                <IconArrowRight className="size-4" />
              </Link>
              <Link href="/login" className="btn-ghost">
                Try the live demo
              </Link>
            </div>
            <p className="mono mt-3 text-[11px] uppercase tracking-[0.16em] text-ink/40">
              demo login · amara@demo.com / demo1234
            </p>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ink/15 pt-6">
              <div>
                <p className="mono text-2xl font-medium">
                  <CountUp value={userCount} />
                </p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Members
                </p>
              </div>
              <div>
                <p className="mono text-2xl font-medium">
                  <CountUp value={accountCount} />
                </p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  Accounts
                </p>
              </div>
              <div>
                <p className="mono text-2xl font-medium">
                  <CountUp value={volume30} variant="moneyCompact" />
                </p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.18em] text-ink/45">
                  30-day volume
                </p>
              </div>
            </div>
          </div>

          {/* live ledger card */}
          <div className="relative lg:col-span-5">
            <div
              className="floaty absolute -right-3 top-10 hidden h-[420px] w-full rotate-3 rounded-xl border border-amber/50 bg-amber/15 sm:block"
              style={{ "--tilt": "3deg" } as React.CSSProperties}
            />
            <div
              className="floaty relative h-full min-h-[420px] rounded-xl border border-ink bg-ink p-6 text-cream shadow-[10px_10px_0_rgba(13,21,18,0.18)]"
              style={{ "--tilt": "-1deg", animationDelay: "0.6s" } as React.CSSProperties}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="size-5 text-lime" />
                  <span className="mono text-[10px] uppercase tracking-[0.25em] text-cream/60">
                    Live ledger
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <span className="live-dot size-1.5 rounded-full bg-lime" />
                  <span className="mono text-[10px] uppercase tracking-[0.2em] text-lime">
                    Settling
                  </span>
                </span>
              </div>
              <LedgerFeed rows={FEED} />
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mono text-[10px] uppercase tracking-[0.2em] text-cream/45">
                  On deposit, all accounts
                </p>
                <p className="mono mt-1 text-3xl font-medium text-lime">
                  <CountUp value={totalFunds} variant="money" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- ticker ---------------- */}
      <div className="border-y border-ink/15 bg-cream py-3 text-ink/70">
        <Marquee items={TICKER} />
      </div>

      {/* ---------------- steps ---------------- */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 lg:py-28">
        <Reveal>
          <p className="eyebrow text-ink/50">How it settles</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Three moves.
            <br />
            Zero friction.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="group border-t-2 border-ink/20 pt-6 transition-colors duration-300 hover:border-limedeep">
                <p className="mono text-[11px] uppercase tracking-[0.22em] text-ink/45">
                  Step {s.n} — {s.label}
                </p>
                <h3 className="mt-3 font-display text-[22px] font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/65">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- account types ---------------- */}
      <section id="accounts" className="scroll-mt-20 border-y border-ink/12 bg-cream/60 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <p className="eyebrow text-ink/50">Account types</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              One wallet. Three instruments.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-12">
            {/* checking — featured */}
            <Reveal className="lg:col-span-7">
              <div className="card card-hover flex h-full flex-col border-t-4 border-t-lime p-7">
                <div className="flex items-center justify-between">
                  <span className="rounded border border-ink/80 bg-lime px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em]">
                    Checking
                  </span>
                  <span className="mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
                    The workhorse
                  </span>
                </div>
                <h3 className="mt-5 font-display text-3xl font-semibold tracking-tight">
                  Daily money, moving fast.
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/65">
                  Your default account. Send and receive from any Meridian
                  member instantly, sweep to savings whenever you like, and
                  watch every balance update in real time.
                </p>
                <dl className="mt-7 space-y-0 border-t border-ink/12 text-sm">
                  {[
                    ["Transfer fee", "R0.00, both directions"],
                    ["Settlement", "Instant — median 42ms"],
                    ["Minimum balance", "R0.00"],
                    ["Welcome credit", "R250, posted at signup"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between border-b border-ink/12 py-3"
                    >
                      <dt className="text-ink/55">{k}</dt>
                      <dd className="mono text-[13px] font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            <div className="flex flex-col gap-6 lg:col-span-5">
              <Reveal delay={100}>
                <div className="card card-hover flex-1 border-t-4 border-t-amber p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-amber/60 bg-amber/15 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#8a5b12]">
                      Savings
                    </span>
                    <span className="mono text-2xl font-medium text-[#8a5b12]">
                      3.20%
                      <span className="text-[11px] uppercase tracking-wider text-ink/40">
                        {" "}
                        APY
                      </span>
                    </span>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink/65">
                    Compounded daily. Park what you're not spending and pull it
                    back with one tap — no lockups, no notice periods.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={180}>
                <div className="card card-hover flex-1 border-t-4 border-t-violet p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-violet/50 bg-violet/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-violet">
                      Credit line
                    </span>
                    <span className="mono text-2xl font-medium text-violet">
                      R5,000
                      <span className="text-[11px] uppercase tracking-wider text-ink/40">
                        {" "}
                        instant
                      </span>
                    </span>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink/65">
                    Spend before payroll, settle on payday. The line is live the
                    moment you open it — no underwriting queue.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- integrity ---------------- */}
      <section id="integrity" className="scroll-mt-20 bg-ink py-20 text-cream lg:py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-5 lg:grid-cols-2 lg:gap-10">
          <Reveal>
            <p className="eyebrow text-lime">Ledger integrity</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Built like a ledger,
              <br />
              not a spreadsheet.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream/60">
              Anyone can draw a balance. Meridian's balances are provable —
              every transfer is one atomic Postgres transaction against
              row-level locks, so concurrent overdrafts simply cannot happen.
            </p>
            <ul className="mt-8 space-y-3.5">
              {[
                "Row-level locking on both accounts before a single cent moves",
                "bcrypt-hashed credentials, HMAC-signed 7-day sessions",
                "Every movement carries a unique, immutable reference",
                "One database transaction per transfer — all or nothing",
              ].map((li) => (
                <li key={li} className="flex items-start gap-3 text-[15px] text-cream/80">
                  <IconCheck className="mt-1 size-4 shrink-0 text-lime" />
                  {li}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={140}>
            <div className="rounded-xl border border-white/12 bg-ink2 p-6 shadow-[8px_8px_0_rgba(201,242,78,0.12)]">
              <div className="mb-5 flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-rose/70" />
                <span className="size-2.5 rounded-full bg-amber/70" />
                <span className="size-2.5 rounded-full bg-lime/80" />
                <span className="mono ml-3 text-[10px] uppercase tracking-[0.2em] text-cream/35">
                  meridian — settlement
                </span>
              </div>
              <div className="mono space-y-2 text-[13px] leading-relaxed">
                <p className="text-cream/90">
                  <span className="text-lime">$</span> meridian send 924.55
                  amara@demo.com
                </p>
                <p className="text-cream/45">→ locking account rows…</p>
                <p className="text-cream/45">→ verifying available funds…</p>
                <p className="text-lime">✓ settled in 42ms</p>
                <p className="text-lime">✓ ref MDB-K4F2X9-QL</p>
                <p className="text-cream/60">
                  both ledgers updated · balances reconciled
                </p>
                <p className="text-cream/90">
                  <span className="live-dot ml-1 inline-block h-4 w-2 translate-y-0.5 bg-lime" />
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="bg-lime">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Open your ledger in
              <br />
              thirty seconds.
            </h2>
            <p className="mono mt-3 text-[11px] uppercase tracking-[0.2em] text-ink/60">
              No credit check · R250 welcome credit · cancel anytime
            </p>
          </div>
          <Link href="/register" className="btn-ink shrink-0">
            Create your account
            <IconArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ---------------- footer ---------------- */}
      <footer className="bg-ink pb-10 pt-16 text-cream/60">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5 text-cream">
                <LogoMark className="size-7 text-lime" />
                <span className="font-display text-lg font-semibold tracking-tight">
                  Meridian
                </span>
                <span className="mono text-[10px] uppercase tracking-[0.3em] text-cream/45">
                  Bank
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed">
                Precision banking for people who count. Person-to-person
                transfers, three account types, one immutable ledger.
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-cream/35">
                Product
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href="#how" className="transition-colors hover:text-lime">
                    How it settles
                  </a>
                </li>
                <li>
                  <a href="#accounts" className="transition-colors hover:text-lime">
                    Account types
                  </a>
                </li>
                <li>
                  <a href="#integrity" className="transition-colors hover:text-lime">
                    Integrity
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-cream/35">
                Access
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link href="/login" className="transition-colors hover:text-lime">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition-colors hover:text-lime">
                    Open an account
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="transition-colors hover:text-lime">
                    Admin console
                  </Link>
                </li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-cream/35">
                Fine print
              </p>
              <p className="mt-4 text-[13px] leading-relaxed">
                Meridian is a demonstration build. It is not a real bank,
                offers no real deposits, and is not FDIC insured. Balances are
                for demonstration purposes only.
              </p>
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[12px] md:flex-row">
            <p>© 2026 Meridian Bank — a demonstration build.</p>
            <p className="mono uppercase tracking-[0.16em] text-cream/35">
              Seeded with Postgres + Prisma
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
