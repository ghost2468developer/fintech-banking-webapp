import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return jsonError("Not signed in.", 401);
  if (me.role !== "ADMIN") return jsonError("Administrator access required.", 403);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { accounts: true },
  });

  const [
    totalAccounts,
    funds,
    volume,
    newUsers7d,
    lastActivityRows,
    recent,
  ] = await Promise.all([
    prisma.account.count(),
    prisma.$queryRaw<{ s: number | null }[]>`SELECT COALESCE(SUM("balance"), 0) AS s FROM "accounts"`,
    prisma.$queryRaw<{ s: number | null; c: number }[]>`
      SELECT COALESCE(SUM("amount"), 0) AS s, COUNT(*)::int AS c
      FROM "transactions"
      WHERE "kind" = 'TRANSFER' AND "createdAt" > NOW() - INTERVAL '30 days'`,
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
    prisma.transaction.findMany({
      take: 14,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    }),
  ]);

  const lastMap = new Map(lastActivityRows.map((r) => [r.uid, r.lastAt]));

  return Response.json({
    stats: {
      totalUsers: users.length,
      totalAccounts,
      totalFunds: Number(funds[0]?.s ?? 0),
      volume30d: Number(volume[0]?.s ?? 0),
      transfers30d: volume[0]?.c ?? 0,
      newUsers7d,
    },
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastActivity: lastMap.get(u.id) ?? null,
      totalBalance: Number(u.accounts.reduce((s, a) => s + Number(a.balance), 0)),
      accounts: u.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        number: a.number,
        balance: Number(a.balance),
        creditLimit: Number(a.creditLimit),
      })),
    })),
    recent: recent.map((t) => ({
      id: t.id,
      reference: t.reference,
      kind: t.kind,
      amount: Number(t.amount),
      note: t.note,
      createdAt: t.createdAt,
      fromName: t.sender ? t.sender.name : "Meridian Bank",
      toName: t.receiver ? t.receiver.name : t.counterparty ?? "—",
    })),
  });
}
