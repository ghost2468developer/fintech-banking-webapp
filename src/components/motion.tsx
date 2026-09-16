"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { compactMoney, money } from "@/lib/format";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/** Scroll-triggered reveal. Renders visible immediately under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Number that eases up to `value` when scrolled into view. */
export function CountUp({
  value,
  format,
  variant = "plain",
  duration = 1500,
  className = "",
}: {
  value: number;
  format?: (n: number) => string;
  variant?: "plain" | "money" | "moneyCompact";
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      setDisplay(value);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const fmt =
    format ??
    (variant === "money"
      ? money
      : variant === "moneyCompact"
        ? compactMoney
        : (n: number) => n.toLocaleString("en-US"));

  return (
    <span ref={ref} className={className}>
      {fmt(Math.round(display * 100) / 100)}
    </span>
  );
}

/** Scramble-decode text effect. */
export function Scramble({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (reducedMotion()) {
      setOut(text);
      return;
    }
    const chars = "MERIDIANR#%&0123456789";
    let frame = 0;
    let raf = 0;
    const total = Math.max(20, Math.round(text.length * 2.1));
    const step = () => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      let s = text.slice(0, reveal);
      for (let i = reveal; i < text.length; i++) {
        s +=
          text[i] === " "
            ? " "
            : chars[Math.floor(Math.random() * chars.length)];
      }
      setOut(frame >= total ? text : s);
      if (frame < total) raf = requestAnimationFrame(step);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [text, delay]);

  return <span className={className}>{out || "\u00A0"}</span>;
}

/** Infinite marquee ticker (duplicated track, pauses on hover). */
export function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span
          key={i}
          className="mono flex items-center gap-5 whitespace-nowrap pr-5 text-[11px] uppercase tracking-[0.18em]"
        >
          <span>{it}</span>
          <span className="text-lime">◆</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="marquee flex w-max">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

export type FeedRow = {
  a: string;
  b: string;
  amt: string;
  sign: 1 | -1;
};

/** Self-cycling ledger feed — a new entry slides in every few seconds. */
export function LedgerFeed({
  rows,
  className = "",
}: {
  rows: FeedRow[];
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [entries, setEntries] = useState(() =>
    rows.slice(0, 5).map((r, i) => ({ ...r, key: i }))
  );
  const idx = useRef(5);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => {
      setEntries((prev) => {
        const next = rows[idx.current % rows.length];
        idx.current += 1;
        return [{ ...next, key: idx.current }, ...prev].slice(0, 5);
      });
    }, 2400);
    return () => clearInterval(t);
  }, [reduced, rows]);

  return (
    <div className={className}>
      {entries.map((e) => (
        <div
          key={e.key}
          className="ledger-row-in flex items-center justify-between gap-3 border-b border-white/10 py-2.5 last:border-0"
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-cream/90">
              {e.a}
            </p>
            <p className="mono truncate text-[10px] uppercase tracking-wider text-cream/40">
              {e.b}
            </p>
          </div>
          <span
            className={`mono shrink-0 text-[13px] ${
              e.sign > 0 ? "text-lime" : "text-cream/70"
            }`}
          >
            {e.sign > 0 ? "+" : "−"}
            {e.amt}
          </span>
        </div>
      ))}
    </div>
  );
}
