"use client";

import { useMemo, useState } from "react";
import type { TxView } from "@/lib/types";
import { formatDateTime, KIND_LABEL, money } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import {
  IconBank,
  IconCart,
  IconReceive,
  IconReceipt,
  IconRepeat,
  IconSend,
} from "@/components/icons";

type Filter = "all" | "sent" | "received" | "out" | "credit";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sent", label: "Sent" },
  { id: "received", label: "Received" },
  { id: "out", label: "Spent" },
  { id: "credit", label: "Credits" },
];

export function TxRow({ t }: { t: TxView }) {
  const isSent = t.direction === "sent";
  const isCredit = t.direction === "credit";
  const isOut = t.direction === "out";

  const Icon = isSent
    ? IconSend
    : isCredit
      ? IconBank
      : isOut
        ? t.kind === "BILL"
          ? IconReceipt
          : t.kind === "DEBIT_ORDER"
            ? IconRepeat
            : IconCart
        : IconReceive;

  const tone = isSent
    ? "border-rose/30 bg-rose/10 text-rose"
    : isCredit
      ? "border-violet/30 bg-violet/10 text-violet"
      : isOut
        ? "border-amber/40 bg-amber/12 text-[#8a5b12]"
        : "border-limedeep/40 bg-lime/40 text-[#5f8a12]";

  const name = isCredit
    ? t.counterparty?.name ?? "Meridian Bank"
    : t.counterparty?.name ?? "—";
  const sub = t.note ?? KIND_LABEL[t.kind] ?? "Transaction";

  return (
    <div className="group flex items-center gap-3.5 border-b border-dashed border-ink/12 py-3.5 last:border-0">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${tone}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold">{name}</p>
        <p className="mono truncate text-[11px] text-ink/45">
          {sub} · {formatDateTime(t.createdAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`mono text-[14px] font-semibold ${
            isSent
              ? "text-ink"
              : isCredit
                ? "text-violet"
                : isOut
                  ? "text-ink"
                  : "text-[#5f8a12]"
          }`}
        >
          {isSent || isOut ? "−" : "+"}
          {money(t.amount)}
        </p>
        <p className="mono text-[10px] tracking-wider text-ink/30">
          {t.reference}
        </p>
      </div>
    </div>
  );
}

export default function ActivityList({
  txns,
  dense = false,
}: {
  txns: TxView[];
  dense?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(
    () => txns.filter((t) => (filter === "all" ? true : t.direction === filter)),
    [txns, filter]
  );

  if (txns.length === 0) {
    return (
      <EmptyState
        title="No movements yet"
        body="Your ledger is fresh. Send a transfer, pay a bill, or make a purchase and it will appear here."
      />
    );
  }

  return (
    <div>
      {!dense && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                filter === f.id
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/20 text-ink/55 hover:border-ink/50 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          body="Try a different filter - the movement is elsewhere in your ledger."
        />
      ) : (
        <div>
          {shown.map((t) => (
            <TxRow key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
