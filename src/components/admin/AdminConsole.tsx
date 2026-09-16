"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminUserRow, PublicUser } from "@/lib/types";
import { formatAccountNumber } from "@/lib/bank";
import { formatDate, timeAgo } from "@/lib/format";
import { Avatar, ErrorNote, RoleBadge, Spinner, TypeBadge } from "@/components/ui";
import {
  IconChevron,
  IconGauge,
  IconLogout,
  IconSearch,
  IconSend,
  IconUsers,
  LogoMark,
} from "@/components/icons";
import { CountUp } from "@/components/motion";

type Stats = {
  totalUsers: number;
  totalAccounts: number;
  newUsers7d: number;
  ledgerEntries: number;
  activeMandates: number;
};

type Detail = { user: AdminUserRow; ledgerEntries: number };

export default function AdminConsole({ user }: { user: PublicUser }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
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

  const recentSignups = useMemo(
    () => [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [users]
  );

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

  const STAT_CARDS: { label: string; value: number }[] = stats
    ? [
        { label: "Registered members", value: stats.totalUsers },
        { label: "Open accounts", value: stats.totalAccounts },
        { label: "New members · 7d", value: stats.newUsers7d },
        { label: "Ledger entries", value: stats.ledgerEntries },
        { label: "Active debit orders", value: stats.activeMandates },
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
              <IconUsers className="size-4" />
              Who is registered
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Member directory
            </h1>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink/50">
            Everyone who registered on the website, identified by name, email
            and account numbers. Balances and amounts are never shown to the
            administrator.
          </p>
        </div>

        {error && (
          <div className="mt-5">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {/* stats (counts only — no money) */}
        <div className="mt-7 grid grid-cols-2 gap-3.5 md:grid-cols-5">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="card p-4">
              <p className="mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                {s.label}
              </p>
              <p className="mono mt-1.5 text-[22px] font-medium">
                <CountUp value={s.value} format={(n) => Math.round(n).toLocaleString()} />
              </p>
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
                      <th className="border-b border-ink/15 pb-2.5 font-medium">Joined</th>
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
                        <td className="mono py-3 text-[11.5px] text-ink/50">
                          {formatDate(u.createdAt)}
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
                          {q ? `No members match “${q}”.` : "No members registered yet — sign-ups will appear here."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* recent registrations */}
            <div className="card mt-6 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Recent registrations
                </h2>
                <span className="mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  Newest first
                </span>
              </div>
              {recentSignups.length === 0 ? (
                <p className="mt-3 py-4 text-sm text-ink/50">
                  The directory is empty — registrations on the website land here.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-dashed divide-ink/10">
                  {recentSignups.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 py-2.5">
                      <Avatar name={u.name} className="size-8 text-[11px]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{u.name}</p>
                        <p className="mono truncate text-[10.5px] text-ink/40">
                          {u.email}
                        </p>
                      </div>
                      <span className="mono shrink-0 text-[10.5px] text-ink/40">
                        {u.accounts.length} acct · joined {formatDate(u.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                  <div className="flex items-center gap-3">
                    <Avatar name={detail.user.name} className="size-11 text-sm" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[15px] font-semibold">
                        {detail.user.name}
                        <RoleBadge role={detail.user.role} />
                      </p>
                      <p className="mono text-[11px] text-ink/45">
                        {detail.user.email}
                      </p>
                    </div>
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
                        Ledger entries
                      </dt>
                      <dd className="mono mt-0.5 text-[15px] font-semibold">
                        {detail.ledgerEntries}
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
                    Account numbers
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {detail.user.accounts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md border border-ink/10 bg-white px-3 py-2"
                      >
                        <TypeBadge type={a.type} />
                        <span className="mono text-[12px] tracking-[0.06em]">
                          {formatAccountNumber(a.number)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mono mt-4 rounded-md border border-ink/10 bg-paper px-3 py-2 text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink/40">
                    Balances &amp; line items are member-only — never visible
                    to the administrator.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="font-display text-lg">No member selected</p>
                  <p className="mx-auto mt-1 max-w-[240px] text-sm text-ink/50">
                    Click any row in the directory to inspect a registered
                    member's profile.
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
