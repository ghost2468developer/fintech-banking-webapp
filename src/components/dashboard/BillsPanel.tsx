"use client";

import { useState } from "react";
import type { PublicAccount, TxView } from "@/lib/types";
import { formatDate, maskNumber, money } from "@/lib/format";
import { BILLERS, billerDueDate, type Biller } from "@/lib/commerce";
import { ErrorNote, Spinner } from "@/components/ui";
import { IconCheck, IconReceipt, IconX } from "@/components/icons";

type Payer =
  | { kind: "preset"; biller: Biller }
  | { kind: "custom"; name: string; code: string; amount: number };

export default function BillsPanel({
  accounts,
  onSettled,
}: {
  accounts: PublicAccount[];
  onSettled: (accounts: PublicAccount[], txn: TxView) => void;
}) {
  const [payer, setPayer] = useState<Payer | null>(null);
  const [amount, setAmount] = useState("");
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    name: string;
    amount: number;
    reference: string;
  } | null>(null);

  const [cName, setCName] = useState("");
  const [cCode, setCCode] = useState("");
  const [cAmount, setCAmount] = useState("");

  function openPreset(b: Biller) {
    setPayer({ kind: "preset", biller: b });
    setAmount(String(b.amount));
    setError(null);
  }

  function openCustom(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(cAmount);
    if (cName.trim().length < 2 || !Number.isFinite(amt) || amt <= 0) return;
    setPayer({
      kind: "custom",
      name: cName.trim(),
      code: cCode.trim(),
      amount: amt,
    });
    setAmount(String(amt));
    setCName("");
    setCCode("");
    setCAmount("");
    setError(null);
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!payer) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billerName: payer.kind === "preset" ? payer.biller.name : payer.name,
          billerCode:
            payer.kind === "preset" ? payer.biller.billerCode : payer.code,
          amount: Number(amount),
          fromAccountId: fromId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSettled(data.accounts, data.transaction);
      setSuccess({
        name: payer.kind === "preset" ? payer.biller.name : payer.name,
        amount: Number(data.transaction.amount),
        reference: data.transaction.reference,
      });
      setPayer(null);
      setAmount("");
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* biller list */}
      <div className="lg:col-span-2">
        <h2 className="font-display text-lg font-semibold">Your bills</h2>
        <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">
          Registered billers · outstanding amounts
        </p>

        {success && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-limedeep/50 bg-lime/30 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-limedeep/60 bg-lime text-ink">
              <IconCheck className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">
                Paid {success.name} = {money(success.amount)}
              </p>
              <p className="mono mt-0.5 text-[11px] text-ink/55">
                ref {success.reference} · biller statement updated
              </p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="rounded p-1 text-ink/45 hover:bg-ink/10"
            >
              <IconX className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {BILLERS.map((b) => {
            const due = billerDueDate(b);
            const urgent = b.dueInDays <= 2;
            const active = payer?.kind === "preset" && payer.biller.name === b.name;
            return (
              <div
                key={b.billerCode}
                className={`flex flex-wrap items-center gap-3 rounded-lg border p-3.5 transition-all ${
                  active
                    ? "border-ink bg-lime/30 shadow-[3px_3px_0_rgba(13,21,18,0.7)]"
                    : "border-ink/15 bg-white hover:border-ink/40"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-md border ${
                    urgent
                      ? "border-rose/40 bg-rose/10 text-rose"
                      : "border-ink/15 bg-paper text-ink/50"
                  }`}
                >
                  <IconReceipt className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                    {b.name}
                    {urgent && (
                      <span className="rounded bg-rose/15 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-rose">
                        Due {b.dueInDays === 0 ? "today" : `in ${b.dueInDays}d`}
                      </span>
                    )}
                  </p>
                  <p className="mono text-[11px] text-ink/45">
                    biller {b.billerCode} · due {formatDate(due)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono text-[15px] font-semibold">
                    {money(b.amount)}
                  </p>
                  <button
                    onClick={() => (active ? setPayer(null) : openPreset(b))}
                    className="mt-1 rounded-md border border-ink/25 px-3 py-1 text-[12px] font-semibold transition-colors hover:border-ink hover:bg-lime/40"
                  >
                    {active ? "Close" : "Pay"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* custom biller */}
        <form
          onSubmit={openCustom}
          className="mt-4 rounded-lg border border-dashed border-ink/25 bg-white/50 p-4"
        >
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
            Pay a custom biller
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_110px_110px_auto]">
            <input
              className="input h-10"
              placeholder="Biller name (e.g. DWS)"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              maxLength={40}
              required
            />
            <input
              className="input h-10 mono"
              placeholder="Biller code"
              value={cCode}
              onChange={(e) => setCCode(e.target.value)}
              maxLength={12}
            />
            <div className="flex h-10 items-center rounded-lg border border-ink/22 bg-white px-3">
              <span className="mono text-sm text-ink/40">R</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="mono h-full w-full bg-transparent px-1.5 text-sm outline-none"
                placeholder="0.00"
                value={cAmount}
                onChange={(e) => setCAmount(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-ghost h-10 !h-10 px-4 text-[13px]"
            >
              Select
            </button>
          </div>
        </form>
      </div>

      {/* pay panel */}
      <div className="lg:col-span-1">
        {payer ? (
          <form onSubmit={pay} className="card sticky top-24 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-semibold">
                  {payer.kind === "preset" ? payer.biller.name : payer.name}
                </p>
                <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/40">
                  {payer.kind === "preset"
                    ? `Biller ${payer.biller.billerCode}`
                    : payer.code
                      ? `Biller ${payer.code}`
                      : "Custom biller"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayer(null)}
                className="rounded p-1.5 text-ink/45 hover:bg-ink/8 hover:text-ink"
              >
                <IconX className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="bill-amount">
                  Amount
                </label>
                <div className="flex items-center rounded-lg border border-ink/25 bg-white px-3.5 focus-within:border-ink focus-within:ring-[3px] focus-within:ring-lime/50">
                  <span className="mono text-lg text-ink/40">R</span>
                  <input
                    id="bill-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="mono h-12 w-full bg-transparent px-2 text-xl font-medium outline-none"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="bill-from">
                  Pay from
                </label>
                <select
                  id="bill-from"
                  className="input cursor-pointer"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type === "CHECKING"
                        ? "Checking"
                        : a.type === "SAVINGS"
                          ? "Savings"
                          : "Credit line"}{" "}
                      · {maskNumber(a.number)} - {money(a.available)} available
                    </option>
                  ))}
                </select>
              </div>

              {error && <ErrorNote>{error}</ErrorNote>}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? (
                  <>
                    <Spinner className="size-4" /> Paying…
                  </>
                ) : amount ? (
                  `Pay ${money(Number(amount))}`
                ) : (
                  "Pay bill"
                )}
              </button>
              <p className="mono text-center text-[10px] uppercase tracking-[0.16em] text-ink/35">
                EFT-style debit · same-day statement
              </p>
            </div>
          </form>
        ) : (
          <div className="card flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
            <IconReceipt className="size-8 text-ink/25" />
            <p className="mt-3 font-display text-lg">Select a biller</p>
            <p className="mt-1 max-w-[220px] text-sm text-ink/50">
              Eskom to Netflix - pick a bill from the list and it clears in
              seconds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
