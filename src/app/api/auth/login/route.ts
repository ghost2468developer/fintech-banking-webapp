import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, sessionCookie } from "@/lib/auth";
import { jsonError, publicAccount, publicUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password)
      return jsonError("Enter your email and password.", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return jsonError("Incorrect email or password.", 401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return jsonError("Incorrect email or password.", 401);

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const token = await signSession(user);
    const res = NextResponse.json({
      user: publicUser(user),
      accounts: accounts.map(publicAccount),
    });
    res.cookies.set(sessionCookie(token));
    return res;
  } catch (err) {
    console.error("login failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
