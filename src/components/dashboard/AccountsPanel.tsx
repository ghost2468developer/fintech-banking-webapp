"use client";

import { useState } from "react";
import type { AccountType, PublicAccount, TxView } from "@/lib/types";
import { ACCOUNT_META } from "@/lib/format";
import { formatAccountNumber } from "@/lib/bank";
import { ErrorNote, Money, Spinner, TypeBadge } from "@/components/ui";
import { IconCheck, IconCoin, IconCopy, IconPlus } from "@/components/icons";

export function AccountCard({ account }: { account: PublicAccount }) {
  const isCredit = account.type === "CREDIT" && account.creditLimit > 0;
  const used = isCredit ? Math.max(0, -account.balance) : 0;
  const pct = isCredit ? Math.min(100, (used / account.creditLimit) * 100) : 0;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(account.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TypeBadge type={account.type} />
          <button
            onClick={copy}
            title="Copy account number"
            className="mono group flex items-center gap-1.5 rounded border border-ink/15 bg-white px-2 py-1 text-[11px] tracking-[0.06em] text-ink/70 transition-colors hover:border-ink/50 hover:text-ink"
          >
            {formatAccountNumber(account.number)}
            {copied ? (
              <IconCheck className="size-3 text-limedeep" />
            ) : (
              <IconCopy className="size-3 text-ink/35 group-hover:text-ink/70" />
            )}
          </button>
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
  onSettled,
}: {
  accounts: PublicAccount[];
  onOpened: (a: PublicAccount) => void;
  onSettled: (accounts: PublicAccount[], txn: TxView) => void;
}) {
  const [chosen, setChosen] = useState<AccountType>("CHECKING");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  /* deposit state */
  const [depAccount, setDepAccount] = useState(accounts[0]?.id ?? "");
  const [depAmount, setDepAmount] = useState("");
  const [depNote, setDepNote] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depError, setDepError] = useState<string | null>(null);
  const [depDone, setDepDone] = useState<string | null>(null);

  const held = new Set(accounts.map((a) => a.type));
  const atMax = accounts.length >= 4;
  const canOpen = !atMax && !held.has(chosen);

  function flashMsg(m: string) {
    setFlash(m);
    setTimeout(() => setFlash(null), 4500);
  }

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
      flashMsg(`${ACCOUNT_META[chosen].label} account opened`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setOpening(false);
    }
  }

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    setDepError(null);
    setDepDone(null);
    setDepositing(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: depAccount,
          amount: Number(depAmount),
          note: depNote.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDepError(data.error ?? "Something went wrong.");
        return;
      }
      const fresh = data.accounts as PublicAccount[];
      onSettled(fresh, data.transaction);
      const acc = fresh.find((a) => a.id === depAccount);
      setDepDone(
        `${data.transaction.reference} · credited ${acc ? "your " + ACCOUNT_META[acc.type].label.toLowerCase() : "the account"}`
      );
      setDepAmount("");
      setDepNote("");
    } catch {
      setDepError("Network error — please try again.");
    } finally {
      setDepositing(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* deposit */}
        <form onSubmit={deposit} className="card h-fit p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md border border-ink/15 bg-paper text-ink/60">
              <IconCoin className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold">Add money</h3>
              <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/40">
                Deposit from your external bank
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="dep-account">
                Credit to
              </label>
              <select
                id="dep-account"
                className="input cursor-pointer"
                value={depAccount}
                onChange={(e) => setDepAccount(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {ACCOUNT_META[a.type].label} · {formatAccountNumber(a.number)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="dep-amount">
                Amount
              </label>
              <div className="flex items-center rounded-lg border border-ink/25 bg-white px-3.5 focus-within:border-ink focus-within:ring-[3px] focus-within:ring-lime/50">
                <span className="mono text-lg text-ink/40">R</span>
                <input
                  id="dep-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  className="mono h-12 w-full bg-transparent px-2 text-xl font-medium outline-none"
                  placeholder="0.00"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  required
                />
              </div>
              <div className="mt-2 flex gap-2">
                {[500, 1000, 2500, 5000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDepAmount(String(v))}
                    className="mono rounded-full border border-ink/20 px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-ink hover:bg-lime/40"
                  >
                    R{v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="dep-note">
                Reference <span className="normal-case text-ink/35">(optional)</span>
              </label>
              <input
                id="dep-note"
                className="input"
                placeholder="Payroll, EFT ref, cash deposit…"
                maxLength={140}
                value={depNote}
                onChange={(e) => setDepNote(e.target.value)}
              />
            </div>

            {depDone && (
              <p className="flex items-center gap-2 rounded-md border border-limedeep/50 bg-lime/30 px-3 py-2 text-[13px] font-medium">
                <IconCheck className="size-4 shrink-0 text-limedeep" />
                Deposit posted — ref {depDone}
              </p>
            )}
            {depError && <ErrorNote>{depError}</ErrorNote>}

            <button type="submit" disabled={depositing} className="btn-primary w-full">
              {depositing ? (
                <>
                  <Spinner className="size-4" /> Crediting…
                </>
              ) : depAmount ? (
                `Deposit ${Number(depAmount).toLocaleString("en-US", { style: "currency", currency: "ZAR", currencyDisplay: "narrowSymbol" })}`
              ) : (
                "Deposit funds"
              )}
            </button>
            <p className="mono text-center text-[10px] uppercase tracking-[0.16em] text-ink/35">
              Same-day settlement · posted to your ledger with a reference
            </p>
          </div>
        </form>

        {/* open account */}
        <div className="card h-fit p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Open a new account</h3>
            <span className="mono text-[11px] uppercase tracking-[0.14em] text-ink/40">
              {accounts.length}/4 open
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/55">
            One of each type, up to four accounts. Every account gets its own
            unique 16-digit number.
          </p>

          {flash && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-limedeep/50 bg-lime/30 px-3 py-2 text-[13px] font-medium text-ink">
              <IconCheck className="size-4 text-limedeep" /> {flash}
            </p>
          )}

          <div className="mt-4 grid gap-2">
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
                  className={`rounded-lg border px-3.5 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
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
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink/55">
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
            className="btn-primary mt-5 w-full"
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
    </div>
  );
}
