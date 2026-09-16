import { ACCOUNT_META, money } from "@/lib/format";
import type { AccountType } from "@/lib/types";

export function Money({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return <span className={`mono ${className}`}>{money(value)}</span>;
}

const typeStyles: Record<AccountType, string> = {
  CHECKING: "bg-lime text-ink border-ink/80",
  SAVINGS: "bg-amber/15 text-[#8a5b12] border-amber/50",
  CREDIT: "bg-violet/12 text-violet border-violet/40",
};

export function TypeBadge({
  type,
  className = "",
}: {
  type: AccountType;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${typeStyles[type]} ${className}`}
    >
      {ACCOUNT_META[type].label}
    </span>
  );
}

const AVA = [
  "bg-ink text-lime",
  "bg-ink3 text-lime",
  "bg-amber/25 text-[#8a5b12]",
  "bg-violet/20 text-violet",
  "bg-rose/20 text-rose",
  "bg-sage/25 text-[#39513f]",
];

export function Avatar({
  name,
  className = "size-8 text-[11px]",
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${AVA[h % AVA.length]} ${className}`}
    >
      {initials}
    </span>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-rose/40 bg-rose/10 px-3 py-2 text-[13px] leading-snug text-rose">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-ink/25 px-6 py-10 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 text-sm text-ink/55">{body}</p>
    </div>
  );
}

export function RoleBadge({ role }: { role: "ADMIN" | "CUSTOMER" }) {
  if (role === "ADMIN")
    return (
      <span className="inline-flex items-center gap-1 rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-lime">
        Admin
      </span>
    );
  return (
    <span className="inline-flex items-center rounded bg-ink/8 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/55">
      Customer
    </span>
  );
}
