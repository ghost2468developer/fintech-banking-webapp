"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  DebitOrderView,
  PublicAccount,
  PublicUser,
  SettledDebitOrder,
  TxView,
} from "@/lib/types";
import { formatDate, greeting, maskNumber, money } from "@/lib/format";
import { BILLERS, billerDueDate } from "@/lib/commerce";
import { Avatar, Money, Spinner, TypeBadge } from "@/components/ui";
import {
  IconActivity,
  IconBank,
  IconCard,
  IconCart,
  IconCheck,
  IconGauge,
  IconLogout,
  IconReceipt,
  IconRepeat,
  IconSend,
  IconX,
  LogoMark,
} from "@/components/icons";
import TransferForm from "@/components/dashboard/TransferForm";
import AccountsPanel, { AccountCard } from "@/components/dashboard/AccountsPanel";
import ActivityList from "@/components/dashboard/ActivityList";
import BuyPanel from "@/components/dashboard/BuyPanel";
import BillsPanel from "@/components/dashboard/BillsPanel";
import DebitOrdersPanel from "@/components/dashboard/DebitOrdersPanel";

type Tab =
  | "overview"
  | "send"
  | "buy"
  | "bills"
  | "orders"
  | "accounts"
  | "activity";

export interface SendPrefill {
  name: string;
  email: string;
  accountId: string;
  accountType: string;
}

const NAV: { id: Tab; label: string; icon: (p: { className?: string }) => React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: IconBank },
  { id: "send", label: "Send money", icon: IconSend },
  { id: "buy", label: "Buy", icon: IconCart },
  { id: "bills", label: "Pay bills", icon: IconReceipt },
  { id: "orders", label: "Debit orders", icon: IconRepeat },
  { id: "accounts", label: "Accounts", icon: IconCard },
  { id: "activity", label: "Activity", icon: IconActivity },
];

const TITLES: Record<Tab, string> = {
  overview: "Overview",
  send: "Send money",
  buy: "Buy",
  bills: "Pay bills",
  orders: "Debit orders",
  accounts: "Your accounts",
  activity: "Activity",
};

export default function Dashboard({ user }: { user: PublicUser }) {
  const [accounts, setAccounts] = useState<PublicAccount[] | null>(null);
  const [txns, setTxns] = useState<TxView[] | null>(null);
  const [orders, setOrders] = useState<DebitOrderView[]>([]);
  const [settled, setSettled] = useState<SettledDebitOrder[] | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [prefill, setPrefill] = useState<SendPrefill | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/transactions").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/debit-orders").then((r) => (r.ok ? r.json() : null)),
    ]).then(([me, tx, dos]) => {
      setAccounts(me?.accounts ?? []);
      setTxns(tx?.transactions ?? []);
      setOrders(dos?.orders ?? []);
      if (dos && Array.isArray(dos.settled) && dos.settled.length > 0) {
        // autopilot just settled due debit orders - resync everything
        setSettled(dos.settled);
        Promise.all([
          fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/transactions").then((r) => (r.ok ? r.json() : null)),
        ]).then(([me2, tx2]) => {
          setAccounts(me2?.accounts ?? []);
          setTxns(tx2?.transactions ?? []);
        });
      }
    });
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function handleSettled(nextAccounts: PublicAccount[], txn: TxView) {
    setAccounts(nextAccounts);
    setTxns((prev) => [txn, ...(prev ?? [])]);
  }

  const total = useMemo(
    () => (accounts ?? []).reduce((s, a) => s + a.balance, 0),
    [accounts]
  );
  const creditAvail = useMemo(
    () =>
      (accounts ?? [])
        .filter((a) => a.creditLimit > 0)
        .reduce((s, a) => s + a.creditLimit, 0),
    [accounts]
  );

  // NOTE: must stay above the early return below, hooks cannot follow
  // conditional returns (Rules of Hooks).
  const upcoming = useMemo(() => {
    const horizon = Date.now() + 21 * 86_400_000;
    const items: {
      key: string;
      kind: "DEBIT" | "BILL";
      name: string;
      date: Date;
      amount: number;
    }[] = [];
    for (const o of orders) {
      if (o.status !== "ACTIVE") continue;
      const t = new Date(o.nextRun).getTime();
      if (t <= horizon)
        items.push({
          key: `do-${o.id}`,
          kind: "DEBIT",
          name: o.merchant,
          date: new Date(o.nextRun),
          amount: o.amount,
        });
    }
    for (const b of BILLERS) {
      const due = billerDueDate(b);
      if (due.getTime() <= horizon)
        items.push({
          key: `bill-${b.billerCode}`,
          kind: "BILL",
          name: b.name,
          date: due,
          amount: b.amount,
        });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4);
  }, [orders]);

  function startSend(p?: SendPrefill) {
    if (p) {
      setPrefill(p);
      setTick((t) => t + 1);
    }
    setTab("send");
  }

  if (!accounts || !txns) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-ink/50">
          <Spinner className="size-5" />
          <span className="mono text-[11px] uppercase tracking-[0.2em]">
            Loading your ledger…
          </span>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      {/* ---------- sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-ink text-cream lg:flex">
        <Link href="/app" className="flex items-center gap-2.5 px-5 pb-6 pt-6">
          <LogoMark className="size-7 text-lime" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Saints
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.3em] text-cream/40">
            Bank
          </span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === n.id
                  ? "bg-white/10 text-cream"
                  : "text-cream/55 hover:bg-white/5 hover:text-cream"
              }`}
            >
              {tab === n.id && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-lime" />
              )}
              <n.icon
                className={`size-[18px] ${tab === n.id ? "text-lime" : "text-cream/40 group-hover:text-cream/70"}`}
              />
              {n.label}
            </button>
          ))}
          {user.role === "ADMIN" && (
            <>
              <div className="pt-3">
                <p className="mono px-3 pb-2 text-[10px] uppercase tracking-[0.22em] text-cream/30">
                  Administration
                </p>
              </div>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-cream/55 transition-colors hover:bg-white/5 hover:text-cream"
              >
                <IconGauge className="size-[18px] text-cream/40" />
                Admin console
              </Link>
            </>
          )}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} className="size-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user.name}</p>
              <p className="mono truncate text-[10px] text-cream/40">
                {user.role === "ADMIN" ? "administrator" : user.email}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-md p-2 text-cream/50 transition-colors hover:bg-white/10 hover:text-lime"
            >
              <IconLogout className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <div className="lg:pl-60">
        {/* mobile header */}
        <div className="sticky top-0 z-30 border-b border-ink/12 bg-paper/90 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/app" className="flex items-center gap-2">
              <LogoMark className="size-6 text-ink" />
              <span className="font-display font-semibold tracking-tight">
                Saints
              </span>
            </Link>
            <div className="flex items-center gap-2">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-md border border-ink/20 p-2 text-ink/70"
                >
                  <IconGauge className="size-4" />
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded-md border border-ink/20 p-2 text-ink/70"
                title="Sign out"
              >
                <IconLogout className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  tab === n.id
                    ? "bg-ink text-cream"
                    : "text-ink/55 hover:bg-ink/8"
                }`}
              >
                {n.label}
              </button>
            ))}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-lime-deep text-limedeep"
              >
                Admin console →
              </Link>
            )}
          </div>
        </div>

        {/* topbar */}
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-ink/12 bg-paper/85 px-8 backdrop-blur-md lg:flex">
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {TITLES[tab]}
          </h1>
          <div className="flex items-center gap-4">
            <span className="mono hidden text-[11px] uppercase tracking-[0.16em] text-ink/40 md:block">
              {today}
            </span>
            <span className="hidden h-5 w-px bg-ink/15 md:block" />
            <span className="mono text-[12px] text-ink/55">{user.email}</span>
            <Avatar name={user.name} className="size-8 text-[11px]" />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
          {settled && settled.length > 0 && !bannerDismissed && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-limedeep/60 bg-lime/35 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-limedeep/60 bg-lime text-ink">
                <IconCheck className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">
                  Autopilot ran - {settled.length} debit order
                  {settled.length > 1 ? "s" : ""} settled
                </p>
                <p className="mono mt-0.5 text-[11px] leading-relaxed text-ink/60">
                  {settled
                    .map(
                      (s) =>
                        `${s.merchant} ${money(s.amount)} · next run ${new Date(s.nextRun).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
                    )
                    .join("  ·  ")}
                </p>
              </div>
              <button
                onClick={() => setBannerDismissed(true)}
                className="rounded p-1 text-ink/50 hover:bg-ink/10"
                title="Dismiss"
              >
                <IconX className="size-4" />
              </button>
            </div>
          )}
          {tab === "overview" && (
            <div>
              <p className="font-display text-3xl font-semibold tracking-tight">
                {greeting()}, {user.name.split(" ")[0]}.
              </p>
              <p className="mono mt-1 text-[11px] uppercase tracking-[0.16em] text-ink/40">
                {today}
              </p>

              {/* total strip */}
              <div className="card mt-6 flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-end">
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
                    Total balance
                  </p>
                  <Money value={total} className="text-4xl font-medium" />
                  {creditAvail > 0 && (
                    <p className="mono mt-1.5 text-[11px] text-violet">
                      + <Money value={creditAvail} className="text-[11px]" />{" "}
                      available credit
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {accounts.map((a) => (
                    <div key={a.id}>
                      <p className="mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                        {a.type === "CHECKING"
                          ? "Checking"
                          : a.type === "SAVINGS"
                            ? "Savings"
                            : "Credit line"}{" "}
                        {maskNumber(a.number).slice(-4)}
                      </p>
                      <Money
                        value={a.balance}
                        className={`text-[15px] font-medium ${
                          a.balance < 0 ? "text-rose" : ""
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">
                      Your accounts
                    </h2>
                    <button
                      onClick={() => setTab("accounts")}
                      className="text-[13px] font-semibold text-ink/60 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink"
                    >
                      Manage
                    </button>
                  </div>
                  {accounts.slice(0, 3).map((a) => (
                    <AccountCard key={a.id} account={a} />
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-ink bg-ink p-5 text-cream">
                    <p className="font-display text-xl font-semibold">
                      Send money
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-cream/60">
                      Instant, fee-free, settled against a row-locked ledger.
                    </p>
                    <button
                      onClick={() => startSend()}
                      className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-ink bg-lime font-semibold text-ink shadow-[3px_3px_0_rgba(201,242,78,0.25)] transition-all hover:-translate-y-0.5"
                    >
                      <IconSend className="size-4" />
                      New transfer
                    </button>
                  </div>

                  {upcoming.length > 0 && (
                    <div className="card p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold">
                          Upcoming
                        </h3>
                        <button
                          onClick={() => setTab("orders")}
                          className="text-[13px] font-semibold text-ink/60 underline decoration-ink/30 underline-offset-4 hover:text-ink"
                        >
                          Manage
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {upcoming.map((u) => (
                          <div
                            key={u.key}
                            className="flex items-center gap-2.5 rounded-md border border-ink/10 bg-white px-3 py-2"
                          >
                            <span
                              className={`mono rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] ${
                                u.kind === "DEBIT"
                                  ? "bg-lime/50 text-ink"
                                  : "bg-amber/15 text-[#8a5b12]"
                              }`}
                            >
                              {u.kind === "DEBIT" ? "Debit" : "Bill"}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                              {u.name}
                            </span>
                            <span className="mono shrink-0 text-[10.5px] text-ink/45">
                              {u.date.toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            <span className="mono shrink-0 text-[12.5px] font-semibold">
                              {money(u.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold">
                        Recent activity
                      </h3>
                      <button
                        onClick={() => setTab("activity")}
                        className="text-[13px] font-semibold text-ink/60 underline decoration-ink/30 underline-offset-4 hover:text-ink"
                      >
                        View all
                      </button>
                    </div>
                    <div className="mt-3">
                      <ActivityList txns={txns.slice(0, 5)} dense />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "send" && (
            <TransferForm
              accounts={accounts}
              recentContacts={txns
                .filter((t) => t.direction === "sent" && t.counterparty)
                .map((t) => ({
                  name: t.counterparty!.name,
                  email: t.counterparty!.email ?? "",
                  accountId: t.counterpartyAccountId ?? "",
                  accountType: t.toAccountType ?? "CHECKING",
                }))
                .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
                .slice(0, 4)}
              prefill={prefill}
              tick={tick}
              onSettled={handleSettled}
            />
          )}

          {tab === "buy" && <BuyPanel accounts={accounts} onSettled={handleSettled} />}

          {tab === "bills" && (
            <BillsPanel accounts={accounts} onSettled={handleSettled} />
          )}

          {tab === "orders" && <DebitOrdersPanel accounts={accounts} />}

          {tab === "accounts" && (
            <AccountsPanel
              accounts={accounts}
              onOpened={(acc) =>
                setAccounts((prev) => [...(prev ?? []), acc])
              }
              onSettled={handleSettled}
            />
          )}

          {tab === "activity" && (
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold">
                Full activity
              </h2>
              <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">
                Last {Math.min(txns.length, 80)} ledger entries
              </p>
              <div className="mt-4">
                <ActivityList txns={txns} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
