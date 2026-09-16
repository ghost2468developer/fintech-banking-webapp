import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * One registered member's profile for the admin: identity, account
 * identifiers and counts — never balances or line-item amounts.
 */
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
    include: {
      accounts: { select: { id: true, type: true, number: true } },
    },
  });
  if (!user) return jsonError("User not found.", 404);

  const [ledgerEntries, last] = await Promise.all([
    prisma.transaction.count({
      where: { OR: [{ senderId: id }, { receiverId: id }] },
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
      accounts: user.accounts.map((a) => ({
        id: a.id,
        type: a.type,
        number: a.number,
      })),
    },
    ledgerEntries,
  });
}
