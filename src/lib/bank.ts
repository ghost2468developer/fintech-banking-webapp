import type { AccountType } from "@/lib/types";

export const WELCOME_CREDIT = 250;
export const MAX_ACCOUNTS = 4;
export const MAX_TRANSFER = 10_000_000;

export const CREDIT_LIMITS: Record<AccountType, number> = {
  CHECKING: 0,
  SAVINGS: 0,
  CREDIT: 5000,
};

const REF_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Unique 16-digit account number, stored WITHOUT spaces (searchable). */
export function newAccountNumber(): string {
  let s = "";
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/** Display form: "5388 2773 6217 4934" */
export function formatAccountNumber(n: string): string {
  return n.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function newReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++)
    s += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  let tail = "";
  for (let i = 0; i < 2; i++)
    tail += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  return `MDB-${s}-${tail}`;
}

/** Round to cents, reject anything that is not a clean positive amount. */
export function sanitizeAmount(raw: unknown): number | null {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n <= 0 || n > MAX_TRANSFER) return null;
  const cents = Math.round(n * 100);
  if (Math.abs(cents / 100 - n) > 0.005) return null;
  return cents / 100;
}
