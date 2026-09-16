"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicAccount, SearchHit, TxView } from "@/lib/types";
import { ACCOUNT_META, maskNumber, money } from "@/lib/format";
import { Avatar, ErrorNote, Money, Spinner, TypeBadge } from "@/components/ui";
import { IconCheck, IconSend, IconX } from "@/components/icons";
import type { SendPrefill } from "@/components/dashboard/Dashboard";

type Recipient = {
  name: string;
  email: string;
  accountId: string;
  accountType: string;
};

export default function TransferForm({
  accounts,
  recentContacts,
  prefill,
  tick,
  onSettled,
}: {
  accounts: PublicAccount[];
  recentContacts: {
    name: string;
    email: string;
    accountId: string;
    accountType: string;
  }[];
  prefill: SendPrefill | null;
  tick: number;
  onSettled: (accounts: PublicAccount[], txn: TxView) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    reference: string;
    amount: number;
    toName: string;
  } | null>(null);
  const debounceRef = useRef<number | null>(null);

  /* apply "send again" prefills */
  useEffect(() => {
    if (prefill && prefill.accountId) {
      setRecipient({
        name: prefill.name,
        email: prefill.email,
        accountId: prefill.accountId,
        accountType: prefill.accountType,
      });
      setQ("");
      setHits(null);
      setSuccess(null);
      setError(null);
    }
  }, [tick, prefill]);

  /* debounced people search */
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setHits(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(q.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setHits(data.results ?? []);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  const fromAccount = useMemo(
    () => accounts.find((a) => a.id === fromId) ?? accounts[0],
    [accounts, fromId]
  );

  function pick(r: Recipient) {
    setRecipient(r);
    setQ("");
    setHits(null);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!recipient) {
      setError("Find the person you want to pay first.");
      return;
    }
    if (!fromAccount) {
      setError("Open an account first — you need somewhere to send from.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: fromAccount.id,
          toAccountId: recipient.accountId,
          amount: Number(amount),
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const t = data.transaction;
      const txn: TxView = {
        id: t.id,
        reference: t.reference,
        kind: t.kind,
        amount: Number(t.amount),
        note: t.note,
        createdAt: t.createdAt,
        direction: "sent",
        counterparty: t.receiver
          ? { name: t.receiver.name, email: t.receiver.email }
          : null,
        counterpartyAccountId: t.toAccountId ?? null,
        fromAccountType: t.fromAccount?.type ?? null,
        toAccountType: t.toAccount?.type ?? null,
      };
      onSettled(data.accounts, txn);
      setSuccess({
        reference: t.reference,
        amount: Number(t.amount),
        toName: recipient.name,
      });
      setAmount("");
      setNote("");
      setRecipient(null);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border-2 border-limedeep bg-lime/40 text-ink">
          <IconCheck className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          Transfer settled
        </h2>
        <p className="mt-2 text-[15px] text-ink/60">
          <Money value={success.amount} className="font-medium text-ink" /> is
          on its way to <span className="font-semibold">{success.toName}</span>.
          Both ledgers updated, balances reconciled.
        </p>
        <p className="mono mt-4 inline-block rounded-md border border-ink/15 bg-paper px-4 py-2 text-[13px] tracking-wider">
          ref {success.reference}
        </p>
        <div className="mt-6">
          <button className="btn-ghost" onClick={() => setSuccess(null)}>
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="card p-6 lg:col-span-2">
        <h2 className="font-display text-lg font-semibold">New transfer</h2>
        <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">
          Instant · R0.00 fee · find anyone by account number
        </p>

        <div className="mt-6 space-y-5">
          {/* recipient */}
          <div>
            <label className="label" htmlFor="recipient">
              To
            </label>
            {recipient ? (
              <div className="flex items-center gap-3 rounded-lg border border-ink bg-lime/25 p-3">
                <Avatar name={recipient.name} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {recipient.name}
                  </p>
                  <p className="mono truncate text-[11px] text-ink/50">
                    {recipient.email}
                  </p>
                </div>
                <TypeBadge type={recipient.accountType as never} />
                <button
                  type="button"
                  onClick={() => setRecipient(null)}
                  className="rounded p-1.5 text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
                  title="Change recipient"
                >
                  <IconX className="size-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="recipient"
                  className="input"
                  placeholder="Name, email, or account number…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  autoComplete="off"
                />
                {hits !== null && (
                  <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-ink/20 bg-white shadow-[6px_6px_0_rgba(13,21,18,0.1)]">
                    {searching ? (
                      <p className="flex items-center gap-2 px-4 py-3 text-sm text-ink/50">
                        <Spinner className="size-3.5" /> Searching members…
                      </p>
                    ) : hits.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-ink/50">
                        No members match “{q.trim()}”.
                      </p>
                    ) : (
                      hits.map((h) => (
                        <div
                          key={h.id}
                          className="border-b border-ink/8 last:border-0"
                        >
                          <div className="flex items-center gap-3 px-3.5 pt-2.5">
                            <Avatar name={h.name} className="size-8 text-[11px]" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {h.name}
                              </p>
                              <p className="mono truncate text-[11px] text-ink/45">
                                {h.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 px-3.5 pb-2.5 pt-2">
                            {h.accounts.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() =>
                                  pick({
                                    name: h.name,
                                    email: h.email,
                                    accountId: a.id,
                                    accountType: a.type,
                                  })
                                }
                                className="flex items-center gap-1.5 rounded-md border border-ink/15 bg-paper px-2 py-1 text-[12px] font-medium transition-colors hover:border-ink hover:bg-lime/40"
                              >
                                {ACCOUNT_META[a.type].label}
                                <span className="mono text-ink/40">
                                  {maskNumber(a.number).slice(-4)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* from */}
          <div>
            <label className="label" htmlFor="from">
              From
            </label>
            <select
              id="from"
              className="input cursor-pointer"
              value={fromAccount?.id ?? ""}
              onChange={(e) => setFromId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {ACCOUNT_META[a.type].label} · {maskNumber(a.number)} —{" "}
                  {money(a.available)} available
                </option>
              ))}
            </select>
          </div>

          {/* amount */}
          <div>
            <label className="label" htmlFor="amount">
              Amount
            </label>
            <div className="flex items-center rounded-lg border border-ink/25 bg-white px-4 focus-within:border-ink focus-within:ring-[3px] focus-within:ring-lime/50">
              <span className="mono text-xl text-ink/40">R</span>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                className="mono h-14 w-full bg-transparent px-2 text-2xl font-medium outline-none"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="mt-2 flex gap-2">
              {[25, 100, 500, 1000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="mono rounded-full border border-ink/20 px-3 py-1 text-[12px] font-medium transition-colors hover:border-ink hover:bg-lime/40"
                >
                  R{v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* note */}
          <div>
            <label className="label" htmlFor="note">
              Note <span className="normal-case text-ink/35">(optional)</span>
            </label>
            <input
              id="note"
              className="input"
              placeholder="Lunch split, rent share, tickets…"
              maxLength={140}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? (
              <>
                <Spinner className="size-4" /> Settling…
              </>
            ) : (
              <>
                <IconSend className="size-4" />
                {amount
                  ? `Send ${Number(amount) > 0 ? money(Number(amount)) : ""}`
                  : "Send money"}
              </>
            )}
          </button>
          <p className="mono text-center text-[10px] uppercase tracking-[0.16em] text-ink/35">
            Every transfer is logged with a unique reference
          </p>
        </div>
      </form>

      {/* recent contacts */}
      <div className="card h-fit p-5">
        <h3 className="font-display text-lg font-semibold">Recent contacts</h3>
        <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">
          One tap to send again
        </p>
        {recentContacts.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">
            No transfers yet — your contacts will appear here.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {recentContacts.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() =>
                  pick({
                    name: c.name,
                    email: c.email,
                    accountId: c.accountId,
                    accountType: c.accountType,
                  })
                }
                className="flex w-full items-center gap-3 rounded-lg border border-ink/12 bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-[3px_3px_0_rgba(13,21,18,0.1)]"
              >
                <Avatar name={c.name} className="size-8 text-[11px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {c.name}
                  </span>
                  <span className="mono block truncate text-[11px] text-ink/45">
                    {c.email}
                  </span>
                </span>
                <IconSend className="size-4 shrink-0 text-ink/35" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
