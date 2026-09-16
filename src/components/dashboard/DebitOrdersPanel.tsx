"use client";

import { useCallback, useEffect, useState } from "react";
import type { DebitOrderView, PublicAccount } from "@/lib/types";
import { maskNumber, money } from "@/lib/format";
import { addInterval, MERCHANTS } from "@/lib/commerce";
import { ErrorNote, Spinner } from "@/components/ui";
import {
  IconPause,
  IconPlay,
  IconPlus,
  IconRepeat,
  IconX,
} from "@/components/icons";

const freqLabel = (f: "WEEKLY" | "MONTHLY") =>
  f === "WEEKLY" ? "/ week" : "/ month";

const runDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default function DebitOrdersPanel({
  accounts,
}: {
  accounts: PublicAccount[];
}) {
  const [orders, setOrders] = useState<DebitOrderView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [merchant, setMerchant] = useState(MERCHANTS[0].name);
  const [customMerchant, setCustomMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [nextRun, setNextRun] = useState(() => {
    const d = new Date(Date.now() + 30 * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/debit-orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch {
      /* keep previous list */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4500);
    return () => clearTimeout(t);
  }, [flash]);

  async function act(order: DebitOrderView, action: "pause" | "resume" | "cancel") {
    try {
      const res = await fetch(`/api/debit-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setOrders((prev) =>
        (prev ?? []).map((o) => (o.id === data.order.id ? data.order : o))
      );
      setFlash(
        action === "pause"
          ? `Paused - ${order.merchant} won't run until you resume it.`
          : action === "resume"
            ? `Resumed - ${order.merchant} runs ${runDate(data.order.nextRun)}.`
            : `Cancelled the ${order.merchant} mandate.`
      );
    } catch {
      setError("Network error - please try again.");
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = customMerchant.trim() || merchant;
    setCreating(true);
    try {
      const res = await fetch("/api/debit-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: name,
          amount: Number(amount),
          frequency,
          fromAccountId: fromId,
          nextRun,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setOrders((prev) => [...(prev ?? []), data.order]);
      setShowForm(false);
      setAmount("");
      setCustomMerchant("");
      setFlash(`Mandate accepted - ${name} ${money(data.order.amount)}${freqLabel(data.order.frequency)}.`);
    } catch {
      setError("Network error - please try again.");
    } finally {
      setCreating(false);
    }
  }

  const isCustom = merchant === "__custom__";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Your mandates</h2>
            <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">
              Run daily at 09:00 · row-locked · referenced
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((s) => !s);
              setError(null);
            }}
            className="btn-ghost !h-10 px-4 text-[13px]"
          >
            <IconPlus className="size-4" />
            New mandate
          </button>
        </div>

        {flash && (
          <p className="mt-4 rounded-md border border-limedeep/50 bg-lime/30 px-3.5 py-2.5 text-[13px] font-medium">
            {flash}
          </p>
        )}

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {orders === null ? (
          <div className="mt-6 flex items-center gap-3 text-ink/50">
            <Spinner className="size-4" />
            <span className="mono text-[11px] uppercase tracking-[0.18em]">
              Fetching mandates…
            </span>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-ink/25 px-6 py-10 text-center">
            <IconRepeat className="mx-auto size-7 text-ink/25" />
            <p className="mt-3 font-display text-lg">No mandates yet</p>
            <p className="mx-auto mt-1 max-w-[280px] text-sm text-ink/50">
              Accept a debit order and Meridian will settle it automatically
              on schedule - Netflix, gyms, fibre, whatever you run.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {orders.map((o) => (
              <div
                key={o.id}
                className={`flex flex-wrap items-center gap-3 rounded-lg border p-4 transition-colors ${
                  o.status === "PAUSED"
                    ? "border-amber/50 bg-amber/8"
                    : "border-ink/15 bg-white"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-md border ${
                    o.status === "PAUSED"
                      ? "border-amber/50 bg-amber/15 text-[#8a5b12]"
                      : "border-ink/15 bg-paper text-ink/55"
                  }`}
                >
                  <IconRepeat className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                    {o.merchant}
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] ${
                        o.status === "ACTIVE"
                          ? "bg-lime/50 text-ink"
                          : "bg-amber/20 text-[#8a5b12]"
                      }`}
                    >
                      {o.status === "ACTIVE" ? "Active" : "Paused"}
                    </span>
                  </p>
                  <p className="mono mt-0.5 text-[11px] text-ink/45">
                    from {maskNumber(o.fromAccount.number)} · next run{" "}
                    {runDate(o.nextRun)}
                  </p>
                </div>
                <p className="mono text-[15px] font-semibold">
                  {money(o.amount)}
                  <span className="text-[11px] font-normal text-ink/40">
                    {freqLabel(o.frequency)}
                  </span>
                </p>
                <div className="flex gap-1.5">
                  {o.status === "ACTIVE" ? (
                    <button
                      onClick={() => act(o, "pause")}
                      title="Pause mandate"
                      className="rounded-md border border-ink/20 p-2 text-ink/60 transition-colors hover:border-amber hover:bg-amber/15 hover:text-[#8a5b12]"
                    >
                      <IconPause className="size-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => act(o, "resume")}
                      title="Resume mandate"
                      className="rounded-md border border-ink/20 p-2 text-ink/60 transition-colors hover:border-limedeep hover:bg-lime/30"
                    >
                      <IconPlay className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => act(o, "cancel")}
                    title="Cancel mandate"
                    className="rounded-md border border-ink/20 p-2 text-ink/60 transition-colors hover:border-rose hover:bg-rose/10 hover:text-rose"
                  >
                    <IconX className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* create mandate */}
      <div className="lg:col-span-1">
        {showForm ? (
          <form onSubmit={create} className="card sticky top-24 p-5">
            <h3 className="font-display text-lg font-semibold">
              Accept a debit order
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="do-merchant">
                  Merchant
                </label>
                <select
                  id="do-merchant"
                  className="input cursor-pointer"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                >
                  {MERCHANTS.map((m) => (
                    <option key={m.code} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  <option value="__custom__">Other (type a name)</option>
                </select>
                {isCustom && (
                  <input
                    className="input mt-2"
                    placeholder="e.g. DSG Gym"
                    value={customMerchant}
                    onChange={(e) => setCustomMerchant(e.target.value)}
                    maxLength={40}
                    required
                  />
                )}
              </div>
              <div>
                <label className="label" htmlFor="do-amount">
                  Amount
                </label>
                <div className="flex items-center rounded-lg border border-ink/25 bg-white px-3.5 focus-within:border-ink focus-within:ring-[3px] focus-within:ring-lime/50">
                  <span className="mono text-lg text-ink/40">R</span>
                  <input
                    id="do-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="mono h-12 w-full bg-transparent px-2 text-xl font-medium outline-none"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <span className="label">Schedule</span>
                <div className="grid grid-cols-2 gap-2">
                  {(["WEEKLY", "MONTHLY"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setFrequency(f);
                        setNextRun(
                          addInterval(
                            new Date(),
                            f
                          )
                            .toISOString()
                            .slice(0, 10)
                        );
                      }}
                      className={`rounded-md border px-3 py-2 text-[13px] font-semibold transition-colors ${
                        frequency === f
                          ? "border-ink bg-lime/50"
                          : "border-ink/20 hover:border-ink/50"
                      }`}
                    >
                      {f === "WEEKLY" ? "Weekly" : "Monthly"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="do-run">
                  First run
                </label>
                <input
                  id="do-run"
                  type="date"
                  className="input"
                  value={nextRun}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setNextRun(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="do-from">
                  Deduct from
                </label>
                <select
                  id="do-from"
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
                      · {maskNumber(a.number)}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? (
                  <>
                    <Spinner className="size-4" /> Accepting…
                  </>
                ) : (
                  <>
                    <IconRepeat className="size-4" />
                    Accept debit order
                  </>
                )}
              </button>
              <p className="mono text-center text-[10px] leading-relaxed uppercase tracking-[0.14em] text-ink/35">
                You can pause or cancel any time before the run date
              </p>
            </div>
          </form>
        ) : (
          <div className="card p-5">
            <h3 className="font-display text-lg font-semibold">How it works</h3>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-ink/60">
              <li className="flex gap-2.5">
                <span className="mono text-limedeep">01</span>
                You accept a mandate - merchant, amount, schedule.
              </li>
              <li className="flex gap-2.5">
                <span className="mono text-limedeep">02</span>
                Every day at 09:00, due mandates settle row-locked, like a
                transfer.
              </li>
              <li className="flex gap-2.5">
                <span className="mono text-limedeep">03</span>
                Each run lands on your ledger with its own reference. Pause,
                resume or cancel anytime.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
