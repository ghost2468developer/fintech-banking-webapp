"use client";

import { useState } from "react";
import type { AccountType, PublicAccount } from "@/lib/types";
import { ACCOUNT_META, maskNumber } from "@/lib/format";
import { ErrorNote, Money, Spinner, TypeBadge } from "@/components/ui";
import { IconCheck, IconPlus } from "@/components/icons";

export function AccountCard({ account }: { account: PublicAccount }) {
  const isCredit = account.type === "CREDIT" && account.creditLimit > 0;
  const used = isCredit ? Math.max(0, -account.balance) : 0;
  const pct = isCredit ? Math.min(100, (used / account.creditLimit) * 100) : 0;

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TypeBadge type={account.type} />
          <span className="mono text-[11px] tracking-[0.08em] text-ink/40">
            {maskNumber(account.number)}
          </span>
        </div>
        <span className="mono text-[10px] uppercase tracking-[0.14em] text-ink/35">
          {new Date(account.createdAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.18em] text-ink/45">
            {isCredit ? "Spent of limit" : "Balance"}
          </p>
          <Money
            value={isCredit ? used : account.balance}
            className={`text-3xl font-medium ${
              account.balance < 0 ? "text-rose" : ""
            }`}
          />
        </div>
        <p className="pb-1 text-right text-[12px] leading-snug text-ink/50">
          {account.type === "CHECKING" && "Instant transfers · R0 fees"}
          {account.type === "SAVINGS" && "3.20% APY · compounding daily"}
          {account.type === "CREDIT" &&
            `${account.creditLimit.toLocaleString("en-US", { style: "currency", currency: "ZAR", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 })} total line`}
        </p>
      </div>
      {isCredit && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-violet transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mono mt-1.5 text-[10px] uppercase tracking-[0.14em] text-violet">
            {pct.toFixed(0)}% of available credit in use
          </p>
        </div>
      )}
    </div>
  );
}

const TYPES: AccountType[] = ["CHECKING", "SAVINGS", "CREDIT"];

export default function AccountsPanel({
  accounts,
  onOpened,
}: {
  accounts: PublicAccount[];
  onOpened: (a: PublicAccount) => void;
}) {
  const [chosen, setChosen] = useState<AccountType>("CHECKING");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const held = new Set(accounts.map((a) => a.type));
  const atMax = accounts.length >= 4;
  const canOpen = !atMax && !held.has(chosen);

  async function open() {
    if (!canOpen) return;
    setOpening(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: chosen }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onOpened(data.account);
      setFlash(`${ACCOUNT_META[chosen].label} account opened`);
      setTimeout(() => setFlash(null), 4000);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Open a new account</h3>
          <span className="mono text-[11px] uppercase tracking-[0.14em] text-ink/40">
            {accounts.length}/4 open
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          One of each type, up to four accounts. New accounts open instantly
          with a R0.00 balance.
        </p>

        {flash && (
          <p className="mt-4 flex items-center gap-2 rounded-md border border-limedeep/50 bg-lime/30 px-3 py-2 text-[13px] font-medium text-ink">
            <IconCheck className="size-4 text-limedeep" /> {flash}
          </p>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {TYPES.map((t) => {
            const isHeld = held.has(t);
            const active = chosen === t;
            const disabled = isHeld || atMax;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => setChosen(t)}
                className={`rounded-lg border px-3.5 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                  active
                    ? "border-ink bg-lime/60 shadow-[3px_3px_0_rgba(13,21,18,0.8)]"
                    : "border-ink/20 bg-white hover:border-ink/50"
                }`}
              >
                <span className="flex items-center justify-between text-[14px] font-semibold">
                  {ACCOUNT_META[t].label}
                  {isHeld ? (
                    <span className="mono text-[10px] uppercase tracking-wider text-ink/40">
                      held
                    </span>
                  ) : active ? (
                    <IconCheck className="size-4" />
                  ) : null}
                </span>
                <span className="mt-1 block text-[12px] leading-snug text-ink/55">
                  {t === "CHECKING" && "Everyday money, instant transfers"}
                  {t === "SAVINGS" && "3.20% APY, compounded daily"}
                  {t === "CREDIT" && "R5,000 instant line, no queue"}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <button
          onClick={open}
          disabled={!canOpen || opening}
          className="btn-primary mt-5"
        >
          {opening ? (
            <>
              <Spinner className="size-4" /> Opening…
            </>
          ) : (
            <>
              <IconPlus className="size-4" />
              Open {canOpen ? ACCOUNT_META[chosen].label : "account"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
