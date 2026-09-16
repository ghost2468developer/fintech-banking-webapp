import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sanitizeAmount, newReference } from "@/lib/bank";
import { jsonError, publicAccount, toTxView } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Insert money into one of the user's own accounts (external deposit). */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Not signed in.", 401);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const accountId = typeof body?.accountId === "string" ? body.accountId : "";
    const note =
      typeof body?.note === "string" && body.note.trim()
        ? body.note.trim().slice(0, 140)
        : null;
    const amount = sanitizeAmount(body?.amount);

    if (!accountId) return jsonError("Choose which account to credit.", 400);
    if (amount === null)
      return jsonError("Enter a valid amount between R0.01 and R10,000,000.", 400);

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: user.id },
    });
    if (!account) return jsonError("That account does not belong to you.", 404);

    const txn = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "accounts" WHERE id = ${account.id} FOR UPDATE`;
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: amount } },
      });
      return tx.transaction.create({
        data: {
          reference: newReference(),
          kind: "CREDIT",
          amount,
          note: note ?? "External deposit",
          counterparty: "Meridian Bank",
          toAccountId: account.id,
          receiverId: user.id,
        },
      });
    });

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const full = await prisma.transaction.findUniqueOrThrow({
      where: { id: txn.id },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        fromAccount: { select: { type: true } },
        toAccount: { select: { type: true } },
      },
    });

    return Response.json(
      {
        transaction: toTxView(full, user.id),
        accounts: accounts.map(publicAccount),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("deposit failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
