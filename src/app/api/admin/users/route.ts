import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Admin directory: WHO is registered on the website.
 * Deliberately returns no balances or amounts — the admin sees members,
 * their account types and identifiers, and activity *timestamps* only.
 */
export async function GET() {
  const me = await getSessionUser();
  if (!me) return jsonError("Not signed in.", 401);
  if (me.role !== "ADMIN") return jsonError("Administrator access required.", 403);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      accounts: { select: { id: true, type: true, number: true } },
    },
  });

  const [
    totalAccounts,
    ledgerEntries,
    activeMandates,
    newUsers7d,
    lastActivityRows,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.debitOrder.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    }),
    prisma.$queryRaw<{ uid: string; lastAt: Date }[]>`
      SELECT uid, MAX(lastAt) AS lastAt
      FROM (
        SELECT "senderId" AS uid, "createdAt" AS lastAt
          FROM "transactions" WHERE "senderId" IS NOT NULL
        UNION ALL
        SELECT "receiverId" AS uid, "createdAt" AS lastAt
          FROM "transactions" WHERE "receiverId" IS NOT NULL
      ) AS activity
      GROUP BY uid`,
  ]);

  const lastMap = new Map(lastActivityRows.map((r) => [r.uid, r.lastAt]));

  return Response.json({
    stats: {
      totalUsers: users.length,
      totalAccounts,
      newUsers7d,
      ledgerEntries,
      activeMandates,
    },
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastActivity: lastMap.get(u.id) ?? null,
      accounts: u.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        number: a.number,
      })),
    })),
  });
}
