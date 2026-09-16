"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminUserRow, PublicUser, TxView } from "@/lib/types";
import {
  compactMoney,
  formatDate,
  formatDateTime,
  maskNumber,
  money,
  timeAgo,
} from "@/lib/format";
import { Avatar, ErrorNote, RoleBadge, Spinner, TypeBadge } from "@/components/ui";
import {
  IconChevron,
  IconGauge,
  IconLogout,
  IconSearch,
  IconSend,
  IconX,
  LogoMark,
} from "@/components/icons";
import { TxRow } from "@/components/dashboard/ActivityList";
import { CountUp } from "@/components/motion";

type Stats = {
  totalUsers: number;
  totalAccounts: number;
  totalFunds: number;
  volume30d: number;
  transfers30d: number;
  newUsers7d: number;
};

type Recent = {
  id: string;
  reference: string;
  kind: string;
  amount: number;
  note: string | null;
  createdAt: string;
  fromName: string;
  toName: string;
};

type Detail = { user: AdminUserRow; transactions: TxView[] };

export default function AdminConsole({ user }: { user: PublicUser }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users ?? []);
      setRecent(data.recent ?? []);
      setError(null);
    } catch {
      setError("Could not load the member directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openUser(id: string) {
    if (id === selectedId) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }, [users, q]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-ink/50">
          <Spinner className="size-5" />
          <span className="mono text-[11px] uppercase tracking-[0.2em]">
            Loading the member directory…
          </span>
        </div>
      </div>
    );
  }

  const STAT_CARDS: {
    label: string;
    value: number;
    fmt: (n: number) => string;
    sub?: string;
  }[] = stats
    ? [
        { label: "Registered members", value: stats.totalUsers, fmt: (n) => n.toLocaleString() },
        { label: "Open accounts", value: stats.totalAccounts, fmt: (n) => n.toLocaleString() },
        { label: "Total on deposit", value: stats.totalFunds, fmt: (n) => compactMoney(n) },
        {
          label: "30-day transfer volume",
          value: stats.volume30d,
          fmt: (n) => compactMoney(n),
          sub: `${stats.transfers30d} transfers`,
        },
        { label: "New members · 7d", value: stats.newUsers7d, fmt: (n) => n.toLocaleString() },
      ]
    : [];

  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-cream">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <LogoMark className="size-6 text-lime" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Meridian
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.3em] text-cream/40">
              Admin console
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden items-center gap-2 rounded-md border border-white/20 px-3.5 py-2 text-[13px] font-semibold text-cream/80 transition-colors hover:border-lime hover:text-lime sm:inline-flex"
            >
              <IconSend className="size-3.5" />
              Your own ledger
            </Link>
            <span className="mono hidden text-[12px] text-cream/50 md:block">
              {user.email}
            </span>
            <Avatar name={user.name} className="size-8 text-[11px]" />
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-md border border-white/20 p-2 text-cream/60 transition-colors hover:border-rose hover:text-rose"
            >
              <IconLogout className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-2 text-limedeep">
              <IconGauge className="size-4" />
              Full system visibility
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Member directory
            </h1>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink/50">
            Everyone registered on Meridian, their accounts, balances, and
            activity. As administrator you can also send and receive money
            from your own console.
          </p>
        </div>

        {error && (
          <div className="mt-5">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {/* stats */}
        <div className="mt-7 grid grid-cols-2 gap-3.5 md:grid-cols-5">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="card p-4">
              <p className="mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                {s.label}
              </p>
              <p className="mono mt-1.5 text-[22px] font-medium">
                <CountUp value={s.value} format={s.fmt} />
              </p>
              {s.sub && (
                <p className="mono text-[10px] uppercase tracking-wider text-ink/40">
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* directory */}
          <div className="lg:col-span-7">
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">
                  All registered users
                </h2>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
                  <input
                    className="input h-9 pl-9 text-[13px]"
                    placeholder="Filter by name or email…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                      <th className="border-b border-ink/15 pb-2.5 font-medium">Member</th>
                      <th className="border-b border-ink/15 pb-2.5 font-medium">Accounts</th>
                      <th className="border-b border-ink/15 pb-2.5 text-right font-medium">Balance</th>
                      <th className="border-b border-ink/15 pb-2.5 pl-4 font-medium">Last active</th>
                      <th className="w-8 border-b border-ink/15 pb-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => openUser(u.id)}
                        className={`cursor-pointer border-b border-dashed border-ink/10 transition-colors last:border-0 hover:bg-lime/15 ${
                          selectedId === u.id ? "bg-lime/20" : ""
                        }`}
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} className="size-8 text-[11px]" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 truncate text-[13.5px] font-semibold">
                                {u.name}
                                <RoleBadge role={u.role} />
                              </p>
                              <p className="mono truncate text-[11px] text-ink/45">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap gap-1">
                            {u.accounts.map((a) => (
                              <TypeBadge key={a.id} type={a.type} />
                            ))}
                          </div>
                        </td>
                        <td className="mono py-3 text-right text-[13.5px] font-semibold">
                          {money(u.totalBalance)}
                        </td>
                        <td className="mono py-3 pl-4 text-[11.5px] text-ink/50">
                          {u.lastActivity ? timeAgo(u.lastActivity) : "—"}
                        </td>
                        <td className="py-3 text-ink/35">
                          <IconChevron
                            className={`size-4 transition-transform ${
                              selectedId === u.id ? "rotate-180" : ""
                            }`}
                          />
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-ink/50">
                          No members match “{q}”.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* live ledger */}
            <div className="card mt-6 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Latest system movements
                </h2>
                <span className="flex items-center gap-1.5">
                  <span className="live-dot size-1.5 rounded-full bg-limedeep" />
                  <span className="mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                    Live
                  </span>
                </span>
              </div>
              <div className="mt-2 divide-y divide-dashed divide-ink/10">
                {recent.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {r.fromName} <span className="text-ink/40">→</span>{" "}
                        {r.toName}
                      </p>
                      <p className="mono truncate text-[10.5px] text-ink/40">
                        {r.note ?? (r.kind === "CREDIT" ? "Credit" : "Transfer")}
                        {" · "}
                        {r.reference}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mono text-[13px] font-semibold">
                        {money(r.amount)}
                      </p>
                      <p className="mono text-[10px] text-ink/35">
                        {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* detail panel */}
          <div className="lg:col-span-5">
            <div className="card sticky top-24 p-5">
              {detailLoading ? (
                <div className="flex items-center gap-3 py-10 text-ink/50">
                  <Spinner className="size-4" />
                  <span className="mono text-[11px] uppercase tracking-[0.18em]">
                    Opening record…
                  </span>
                </div>
              ) : detail ? (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={detail.user.name} className="size-11 text-sm" />
                      <div>
                        <p className="flex items-center gap-2 text-[15px] font-semibold">
                          {detail.user.name}
                          <RoleBadge role={detail.user.role} />
                        </p>
                        <p className="mono text-[11px] text-ink/45">
                          {detail.user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedId(null);
                        setDetail(null);
                      }}
                      className="rounded p-1.5 text-ink/40 transition-colors hover:bg-ink/8 hover:text-ink"
                    >
                      <IconX className="size-4" />
                    </button>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-ink/10 py-4 text-[13px]">
                    <div>
                      <dt className="mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                        Member since
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {formatDate(detail.user.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                        Last activity
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {detail.user.lastActivity
                          ? timeAgo(detail.user.lastActivity)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                        Total balance
                      </dt>
                      <dd className="mono mt-0.5 text-[15px] font-semibold">
                        {money(detail.user.totalBalance)}
                      </dd>
                    </div>
                    <div>
                      <dt className="mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                        Accounts
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {detail.user.accounts.length} open
                      </dd>
                    </div>
                  </dl>

                  <p className="mono mt-4 text-[10px] uppercase tracking-[0.18em] text-ink/40">
                    Accounts
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {detail.user.accounts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md border border-ink/10 bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <TypeBadge type={a.type} />
                          <span className="mono text-[11px] text-ink/45">
                            {maskNumber(a.number)}
                          </span>
                        </div>
                        <span className="mono text-[13px] font-semibold">
                          {money(a.balance)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mono mt-5 text-[10px] uppercase tracking-[0.18em] text-ink/40">
                    Recent ledger
                  </p>
                  <div className="mt-1">
                    {detail.transactions.length === 0 ? (
                      <p className="py-4 text-sm text-ink/50">
                        No movements recorded yet.
                      </p>
                    ) : (
                      detail.transactions.map((t) => <TxRow key={t.id} t={t} />)
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="font-display text-lg">No member selected</p>
                  <p className="mx-auto mt-1 max-w-[240px] text-sm text-ink/50">
                    Click any row in the directory to inspect their accounts
                    and ledger.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
