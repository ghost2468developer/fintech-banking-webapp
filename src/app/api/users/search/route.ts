import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Not signed in.", 401);

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ results: [] });

  const conditions: Record<string, unknown>[] = [
    { name: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
  ];
  // Account numbers are the canonical way to find someone match on
  // digits (spaces stripped, so pasted "5388 2773…" and raw digits both work).
  const qDigits = q.replace(/\D/g, "");
  if (qDigits.length >= 4) {
    conditions.push({ accounts: { some: { number: { contains: qDigits } } } });
  }

  const results = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      OR: conditions,
    },
    include: {
      accounts: {
        select: { id: true, type: true, number: true, balance: true },
      },
    },
    orderBy: { name: "asc" },
    take: 6,
  });

  return Response.json({
    results: results.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      accounts: r.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        number: a.number,
        balance: Number(a.balance),
      })),
    })),
  });
}

