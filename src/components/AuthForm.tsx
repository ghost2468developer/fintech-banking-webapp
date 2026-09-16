"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ACCOUNT_META } from "@/lib/format";
import type { AccountType } from "@/lib/types";
import { ErrorNote, Spinner } from "@/components/ui";
import { IconCheck, LogoMark } from "@/components/icons";

const TYPES: AccountType[] = ["CHECKING", "SAVINGS", "CREDIT"];

export default function AuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("CHECKING");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : { name, email, password, accountType }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = "/app";
    } catch {
      setError("Network error - please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-cream lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(250,248,240,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(250,248,240,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <LogoMark className="size-7 text-lime" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Saints
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.3em] text-cream/45">
            Bank
          </span>
        </Link>
        <div className="relative">
          <p className="font-display text-4xl font-semibold leading-tight tracking-tight">
            “Precision is a feature.
            <br />
            So is <span className="text-lime">kindness</span>.”
          </p>
          <p className="mono mt-4 text-[11px] uppercase tracking-[0.2em] text-cream/40">
            - the founding memo, 2026
          </p>
        </div>
        <div className="relative mono space-y-1.5 text-[12px] text-cream/40">
          <p>
            <span className="text-lime">✓</span> ref MDB-K4F2X9 · settled 42ms
          </p>
          <p>
            <span className="text-lime">✓</span> ref MDB-7QPLM3 · settled 38ms
          </p>
          <p>
            <span className="text-lime">✓</span> ref MDB-2WVN8C · settled 45ms
          </p>
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mono mb-8 inline-block text-[11px] uppercase tracking-[0.2em] text-ink/45 transition-colors hover:text-ink"
          >
            ← Back to Saints
          </Link>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            {isLogin ? "Welcome back." : "Open your ledger."}
          </h1>
          <p className="mt-2 text-[15px] text-ink/60">
            {isLogin
              ? "Sign in to your accounts and recent activity."
              : "Thirty seconds from now you'll have a live checking account with a R250 welcome credit."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {!isLogin && (
              <div>
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  className="input"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder={isLogin ? "Your password" : "At least 8 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={isLogin ? undefined : 8}
                required
              />
            </div>

            {!isLogin && (
              <div>
                <span className="label">Starting account</span>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAccountType(t)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                        accountType === t
                          ? "border-ink bg-lime/60 shadow-[2px_2px_0_rgba(13,21,18,0.8)]"
                          : "border-ink/20 bg-white hover:border-ink/50"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                        {accountType === t && (
                          <IconCheck className="size-3.5" />
                        )}
                        {ACCOUNT_META[t].label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-tight text-ink/50">
                        {t === "CHECKING"
                          ? "Instant transfers"
                          : t === "SAVINGS"
                            ? "3.20% APY"
                            : "R5,000 line"}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mono mt-2 text-[11px] text-ink/40">
                  Your R250 welcome credit is posted to this account.
                </p>
              </div>
            )}

            {error && <ErrorNote>{error}</ErrorNote>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Spinner className="size-4" />
                  {isLogin ? "Signing in…" : "Opening your account…"}
                </>
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/55">
            {isLogin ? (
              <>
                New to Saints?{" "}
                <Link href="/register" className="font-semibold text-ink underline decoration-limedeep decoration-2 underline-offset-4 hover:decoration-ink">
                  Open an account
                </Link>
              </>
            ) : (
              <>
                Already a member?{" "}
                <Link href="/login" className="font-semibold text-ink underline decoration-limedeep decoration-2 underline-offset-4 hover:decoration-ink">
                  Sign in
                </Link>
              </>
            )}
          </p>

          {isLogin && (
            <div className="mt-8 rounded-lg border border-ink/15 bg-cream p-4">
              <p className="mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
                Seeded administrator (the only account `npm seed` creates)
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@Saints.com");
                  setPassword("admin1234");
                }}
                className="mt-3 w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-left text-[12px] transition-colors hover:border-ink"
              >
                <span className="block font-semibold">Administrator</span>
                <span className="mono text-ink/50">
                  admin@Saints.com / admin1234
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
