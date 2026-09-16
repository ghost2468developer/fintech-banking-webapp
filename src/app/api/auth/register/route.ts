import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, sessionCookie } from "@/lib/auth";
import {
  CREDIT_LIMITS,
  WELCOME_CREDIT,
  newAccountNumber,
  newReference,
} from "@/lib/bank";
import { ACCOUNT_TYPES, jsonError, publicAccount, publicUser } from "@/lib/api";
import type { AccountType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    let type: AccountType = "CHECKING";
    if (
      typeof body?.accountType === "string" &&
      (ACCOUNT_TYPES as string[]).includes(body.accountType)
    ) {
      type = body.accountType as AccountType;
    }

    if (name.length < 2 || name.length > 60)
      return jsonError("Please enter your full name.", 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return jsonError("Please enter a valid email address.", 400);
    if (password.length < 8)
      return jsonError("Password must be at least 8 characters.", 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return jsonError("An account with this email already exists.", 409);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { name, email, passwordHash, role: "CUSTOMER" },
      });
      const acc = await tx.account.create({
        data: {
          userId: u.id,
          number: newAccountNumber(),
          type,
          creditLimit: CREDIT_LIMITS[type],
          balance: 0,
        },
      });
      await tx.transaction.create({
        data: {
          reference: newReference(),
          kind: "CREDIT",
          amount: WELCOME_CREDIT,
          note: "Welcome credit",
          toAccountId: acc.id,
          receiverId: u.id,
        },
      });
      await tx.account.update({
        where: { id: acc.id },
        data: { balance: { increment: WELCOME_CREDIT } },
      });
      return u;
    });

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const token = await signSession(user);
    const res = NextResponse.json(
      { user: publicUser(user), accounts: accounts.map(publicAccount) },
      { status: 201 }
    );
    res.cookies.set(sessionCookie(token));
    return res;
  } catch (err) {
    console.error("register failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
