import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sanitizeAmount, newReference } from "@/lib/bank";
import { jsonError, publicAccount, toTxView } from "@/lib/api";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export const TX_INCLUDE = {
  sender: { select: { name: true, email: true } },
  receiver: { select: { name: true, email: true } },
  fromAccount: { select: { type: true } },
  toAccount: { select: { type: true } },
} as const;

/** Current user's ledger (last 80 entries). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Not signed in.", 401);

  const txns = await prisma.transaction.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: TX_INCLUDE,
  });

  return Response.json({
    transactions: txns.map((t) => toTxView(t, user.id)),
  });
}

/** Person-to-person transfer, settled atomically with row-level locks. */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Not signed in.", 401);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const fromAccountId = typeof body?.fromAccountId === "string" ? body.fromAccountId : "";
    const toAccountId = typeof body?.toAccountId === "string" ? body.toAccountId : "";
    const note =
      typeof body?.note === "string" && body.note.trim()
        ? body.note.trim().slice(0, 140)
        : null;
    const amount = sanitizeAmount(body?.amount);

    if (!fromAccountId || !toAccountId)
      return jsonError("Select both an account and a recipient.", 400);
    if (amount === null)
      return jsonError("Enter a valid amount between R0.01 and R10,000,000.", 400);

    const from = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: user.id },
    });
    if (!from) return jsonError("That sending account does not belong to you.", 404);

    const to = await prisma.account.findUnique({
      where: { id: toAccountId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!to) return jsonError("Recipient account not found.", 404);
    if (to.userId === user.id)
      return jsonError(
        "You can't transfer to yourself - that's a sweep between your own accounts.",
        400
      );

    const settled = await prisma.$transaction(async (tx) => {
      // Lock both account rows (ordered by id) to prevent concurrent-overdraft races.
      const ids = [from.id, to.id].sort();
      await tx.$queryRaw`SELECT id FROM "accounts" WHERE id = ${ids[0]} OR id = ${ids[1]} ORDER BY id FOR UPDATE`;

      const [f, t] = await Promise.all([
        tx.account.findUniqueOrThrow({ where: { id: from.id } }),
        tx.account.findUniqueOrThrow({ where: { id: to.id } }),
      ]);

      const available = Number(f.balance) + Number(f.creditLimit);
      if (available < amount)
        throw new Error(`INSUFFICIENT:${available.toFixed(2)}`);

      await tx.account.update({
        where: { id: f.id },
        data: { balance: { decrement: amount } },
      });
      await tx.account.update({
        where: { id: t.id },
        data: { balance: { increment: amount } },
      });

      return tx.transaction.create({
        data: {
          reference: newReference(),
          kind: "TRANSFER",
          amount,
          note,
          fromAccountId: f.id,
          toAccountId: t.id,
          senderId: user.id,
          receiverId: t.userId,
        },
      });
    });

    const [freshAccounts] = await Promise.all([
      prisma.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      }),
      settled,
    ]);

    return Response.json(
      {
        transaction: (await prisma.transaction.findUniqueOrThrow({
          where: { id: settled.id },
          include: TX_INCLUDE,
        })) as never,
        accounts: freshAccounts.map(publicAccount),
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("INSUFFICIENT")) {
      const avail = msg.split(":")[1];
      return jsonError(
        `Insufficient funds - that account has ${money(Number(avail))} available.`,
        400
      );
    }
    console.error("transfer failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
