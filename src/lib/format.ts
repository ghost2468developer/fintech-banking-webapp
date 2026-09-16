import type { AccountType } from "@/lib/types";

export const CURRENCY = "ZAR";

const zar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ZAR",
  currencyDisplay: "narrowSymbol",
});

const zarCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ZAR",
  currencyDisplay: "narrowSymbol",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function money(v: number): string {
  return zar.format(v);
}

export function compactMoney(v: number): string {
  return zarCompact.format(v);
}

export function maskNumber(n: string): string {
  const digits = n.replace(/\D/g, "");
  return `•••• ${digits.slice(-4)}`;
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(d: string | Date): string {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: string | Date): string {
  return dateTimeFmt.format(new Date(d));
}

export function timeAgo(d: string | Date): string {
  const t = new Date(d).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export const KIND_LABEL: Record<string, string> = {
  TRANSFER: "Transfer",
  CREDIT: "Credit",
  PURCHASE: "Purchase",
  BILL: "Bill payment",
  DEBIT_ORDER: "Debit order",
};

export const ACCOUNT_META: Record<
  AccountType,
  { label: string; blurb: string }
> = {
  CHECKING: {
    label: "Checking",
    blurb: "Daily money. Instant transfers, zero fees, no ceiling on movement.",
  },
  SAVINGS: {
    label: "Savings",
    blurb: "3.20% APY, compounded daily. Pull it back with one tap.",
  },
  CREDIT: {
    label: "Credit line",
    blurb: "R5,000 instant line. Spend before payroll, repay on payday.",
  },
};
