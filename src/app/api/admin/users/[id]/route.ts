import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonError, toTxView } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const me = await getSessionUser();
  if (!me) return jsonError("Not signed in.", 401);
  if (me.role !== "ADMIN")
    return jsonError("Administrator access required.", 403);

  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { accounts: true },
  });
  if (!user) return jsonError("User not found.", 404);

  const [txns, last] = await Promise.all([
    prisma.transaction.findMany({
      where: { OR: [{ senderId: id }, { receiverId: id }] },
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        fromAccount: { select: { type: true } },
        toAccount: { select: { type: true } },
      },
    }),
    prisma.transaction.findFirst({
      where: { OR: [{ senderId: id }, { receiverId: id }] },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastActivity: last?.createdAt ?? null,
      totalBalance: Number(
        user.accounts.reduce((s, a) => s + Number(a.balance), 0)
      ),
      accounts: user.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        number: a.number,
        balance: Number(a.balance),
        creditLimit: Number(a.creditLimit),
      })),
    },
    transactions: txns.map((t) => toTxView(t, id)),
  });
}
