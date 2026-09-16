import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { PublicUser } from "@/lib/types";

export const SESSION_COOKIE = "Saints_session";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "Saints-dev-secret-rotate-me"
);

export async function signSession(user: {
  id: string;
  role: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    path: "/",
    maxAge: 0,
  };
}

/** Returns the verified user for the current request, or null. */
export async function getSessionUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}
