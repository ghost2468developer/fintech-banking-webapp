"use client";

import { useState } from "react";
import type { PublicAccount, TxView } from "@/lib/types";
import { maskNumber, money } from "@/lib/format";
import { MERCHANTS, type Merchant } from "@/lib/commerce";
import { ErrorNote, Spinner } from "@/components/ui";
import { IconCart, IconCheck, IconX } from "@/components/icons";

export default function BuyPanel({
  accounts,
  onSettled,
}: {
  accounts: PublicAccount[];
  onSettled: (accounts: PublicAccount[], txn: TxView) => void;
}) {
  const [selected, setSelected] = useState<Merchant | "custom" | null>(null);
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    merchant: string;
    amount: number;
    reference: string;
  } | null>(null);

  const merchantName =
    selected === "custom"
      ? customName.trim()
      : selected
        ? selected.name
        : "";

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: merchantName,
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
        merchant: merchantName,
        amount: Number(data.transaction.amount),
        reference: data.transaction.reference,
      });
      setAmount("");
      setSelected(null);
      setCustomName("");
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* merchant picker */}
      <div className="lg:col-span-3">
        <h2 className="font-display text-lg font-semibold">Shop partners</h2>
        <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">
          12 partners · airtime included · settled instantly
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {MERCHANTS.map((m) => {
            const active = selected !== null && selected !== "custom" && selected.name === m.name;
            return (
              <button
                key={m.code}
                onClick={() => {
                  setSelected(m);
                  setError(null);
                }}
                className={`rounded-lg border p-3.5 text-left transition-all ${
                  active
                    ? "border-ink bg-lime/50 shadow-[3px_3px_0_rgba(13,21,18,0.8)]"
                    : "border-ink/15 bg-white hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-[3px_3px_0_rgba(13,21,18,0.08)]"
                }`}
              >
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
                  {m.code}
                </span>
                <span className="mt-1 block text-[14px] font-semibold leading-tight">
                  {m.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-ink/50">
                  {m.category}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => {
              setSelected("custom");
              setError(null);
            }}
            className={`rounded-lg border border-dashed p-3.5 text-left transition-all ${
              selected === "custom"
                ? "border-ink bg-lime/50 shadow-[3px_3px_0_rgba(13,21,18,0.8)]"
                : "border-ink/25 bg-white/60 hover:border-ink/50"
            }`}
          >
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
              Other
            </span>
            <span className="mt-1 block text-[14px] font-semibold">
              Any merchant…
            </span>
            <span className="mt-0.5 block text-[11px] text-ink/50">
              Type a store name
            </span>
          </button>
        </div>
      </div>

      {/* pay panel */}
      <div className="lg:col-span-2">
        {success ? (
          <div className="card p-6 text-center">
            <div className="mx-auto flex size-13 h-13 w-13 items-center justify-center rounded-full border-2 border-limedeep bg-lime/40 text-ink">
              <IconCheck className="size-6" />
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold">
              Paid {success.merchant}
            </h3>
            <p className="mt-1.5 text-sm text-ink/60">
              {money(success.amount)} settled from your account. The merchant
              sees it as a card-style purchase with a reference.
            </p>
            <p className="mono mt-3 inline-block rounded-md border border-ink/15 bg-paper px-3.5 py-1.5 text-[12px] tracking-wider">
              ref {success.reference}
            </p>
            <div className="mt-5">
              <button className="btn-ghost" onClick={() => setSuccess(null)}>
                Buy again
              </button>
            </div>
          </div>
        ) : selected ? (
          <form onSubmit={pay} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-semibold">
                  {selected === "custom" ? "Custom merchant" : selected.name}
                </p>
                {selected === "custom" && (
                  <input
                    className="input mt-2"
                    placeholder="Merchant name (e.g. Spar)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    maxLength={40}
                    required
                  />
                )}
                {selected !== "custom" && (
                  <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink/40">
                    {selected.category}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setCustomName("");
                  setError(null);
                }}
                className="rounded p-1.5 text-ink/45 hover:bg-ink/8 hover:text-ink"
              >
                <IconX className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="buy-amount">
                  Amount
                </label>
                <div className="flex items-center rounded-lg border border-ink/25 bg-white px-3.5 focus-within:border-ink focus-within:ring-[3px] focus-within:ring-lime/50">
                  <span className="mono text-lg text-ink/40">R</span>
                  <input
                    id="buy-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    className="mono h-12 w-full bg-transparent px-2 text-xl font-medium outline-none"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {[50, 100, 250, 500].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="mono rounded-full border border-ink/20 px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-ink hover:bg-lime/40"
                    >
                      R{v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="buy-from">
                  Pay from
                </label>
                <select
                  id="buy-from"
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

              {selected !== "custom" && selected?.category === "Airtime & Data" && (
                <p className="rounded-md border border-lime/60 bg-lime/25 px-3 py-2 text-[12px] text-ink/70">
                  Airtime is credited to the number on your profile
                  immediately after settlement.
                </p>
              )}

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
                    <IconCart className="size-4" />
                    {amount
                      ? `Pay ${merchantName || "merchant"} ${money(Number(amount))}`
                      : "Pay merchant"}
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="card flex h-full min-h-[220px] flex-col items-center justify-center p-8 text-center">
            <IconCart className="size-8 text-ink/25" />
            <p className="mt-3 font-display text-lg">Pick a merchant</p>
            <p className="mt-1 max-w-[220px] text-sm text-ink/50">
              Groceries, airtime, fashion, electronics - charged straight from
              your Saints account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
