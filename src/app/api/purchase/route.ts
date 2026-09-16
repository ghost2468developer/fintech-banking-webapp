import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sanitizeAmount, newReference } from "@/lib/bank";
import { jsonError, publicAccount, toTxView } from "@/lib/api";
import { MERCHANTS } from "@/lib/commerce";

export const dynamic = "force-dynamic";

/** Buy from a partner merchant (or any named merchant) from one of your accounts. */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Not signed in.", 401);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const rawMerchant =
      typeof body?.merchant === "string" ? body.merchant.trim() : "";
    const fromAccountId =
      typeof body?.fromAccountId === "string" ? body.fromAccountId : "";
    const note =
      typeof body?.note === "string" && body.note.trim()
        ? body.note.trim().slice(0, 140)
        : null;
    const amount = sanitizeAmount(body?.amount);

    if (rawMerchant.length < 2 || rawMerchant.length > 40)
      return jsonError("Choose or type the merchant you're paying.", 400);
    const merchant =
      MERCHANTS.find((m) => m.name.toLowerCase() === rawMerchant.toLowerCase())
        ?.name ?? rawMerchant;

    if (!fromAccountId)
      return jsonError("Choose which account to pay from.", 400);
    if (amount === null)
      return jsonError("Enter a valid amount between R0.01 and R10,000,000.", 400);

    const from = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: user.id },
    });
    if (!from) return jsonError("That account does not belong to you.", 404);

    const txn = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "accounts" WHERE id = ${from.id} FOR UPDATE`;
      const f = await tx.account.findUniqueOrThrow({ where: { id: from.id } });
      const available = Number(f.balance) + Number(f.creditLimit);
      if (available < amount)
        throw new Error(`INSUFFICIENT:${available.toFixed(2)}`);

      await tx.account.update({
        where: { id: f.id },
        data: { balance: { decrement: amount } },
      });

      return tx.transaction.create({
        data: {
          reference: newReference(),
          kind: "PURCHASE",
          amount,
          note,
          counterparty: merchant,
          fromAccountId: f.id,
          senderId: user.id,
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
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("INSUFFICIENT")) {
      const avail = msg.split(":")[1];
      return jsonError(
        `Insufficient funds — that account has R ${Number(avail).toLocaleString("en-US", { minimumFractionDigits: 2 })} available.`,
        400
      );
    }
    console.error("purchase failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
