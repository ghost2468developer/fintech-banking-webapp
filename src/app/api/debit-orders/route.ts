import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sanitizeAmount, newReference } from "@/lib/bank";
import { jsonError } from "@/lib/api";
import { addInterval, MERCHANTS } from "@/lib/commerce";
import type { DebitOrderView, SettledDebitOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

function toView(o: {
  id: string;
  merchant: string;
  amount: { toString(): string };
  frequency: string;
  nextRun: Date;
  status: string;
  createdAt: Date;
  fromAccount: { id: string; type: string; number: string; balance: { toString(): string } };
}): DebitOrderView {
  return {
    id: o.id,
    merchant: o.merchant,
    amount: Number(o.amount),
    frequency: o.frequency as "WEEKLY" | "MONTHLY",
    nextRun: o.nextRun,
    status: o.status as "ACTIVE" | "PAUSED" | "CANCELLED",
    fromAccount: {
      id: o.fromAccount.id,
      type: o.fromAccount.type as DebitOrderView["fromAccount"]["type"],
      number: o.fromAccount.number,
      balance: Number(o.fromAccount.balance),
    },
    createdAt: o.createdAt,
  };
}

/**
 * List the user's debit orders. Any ACTIVE order whose nextRun is due
 * is settled on the spot (row-locked, atomically) — the same way a real
 * debit-order run would hit the ledger.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Not signed in.", 401);

    const now = new Date();

    const settled: SettledDebitOrder[] = await prisma.$transaction(async (tx) => {
      const due = await tx.debitOrder.findMany({
        where: { userId: user.id, status: "ACTIVE", nextRun: { lte: now } },
        orderBy: { nextRun: "asc" },
      });

      const out: SettledDebitOrder[] = [];
      for (const d of due) {
        await tx.$queryRaw`SELECT id FROM "accounts" WHERE id = ${d.fromAccountId} FOR UPDATE`;
        const acc = await tx.account.findUniqueOrThrow({
          where: { id: d.fromAccountId },
        });
        const available = Number(acc.balance) + Number(acc.creditLimit);
        const amt = Number(d.amount);
        const next = addInterval(d.nextRun, d.frequency);

        if (available >= amt) {
          await tx.account.update({
            where: { id: d.fromAccountId },
            data: { balance: { decrement: amt } },
          });
          const txn = await tx.transaction.create({
            data: {
              reference: newReference(),
              kind: "DEBIT_ORDER",
              amount: amt,
              note: "Autopilot",
              counterparty: d.merchant,
              fromAccountId: d.fromAccountId,
              senderId: user.id,
              debitOrderId: d.id,
            },
          });
          await tx.debitOrder.update({
            where: { id: d.id },
            data: { nextRun: next },
          });
          out.push({
            merchant: d.merchant,
            amount: amt,
            reference: txn.reference,
            nextRun: next,
          });
        } else {
          // Could not afford this cycle — advance the schedule (real banks
          // may try once more and then fail the mandate; here we skip it).
          await tx.debitOrder.update({
            where: { id: d.id },
            data: { nextRun: next },
          });
        }
      }
      return out;
    });

    const orders = await prisma.debitOrder.findMany({
      where: { userId: user.id, status: { not: "CANCELLED" } },
      include: {
        fromAccount: {
          select: { id: true, type: true, number: true, balance: true },
        },
      },
      orderBy: [{ status: "asc" }, { nextRun: "asc" }],
    });

    return Response.json({
      orders: orders.map(toView),
      settled,
    });
  } catch (err) {
    console.error("debit orders list failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** Mandate a new debit order. */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Not signed in.", 401);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const rawMerchant =
      typeof body?.merchant === "string" ? body.merchant.trim() : "";
    const frequency = body?.frequency;
    const fromAccountId =
      typeof body?.fromAccountId === "string" ? body.fromAccountId : "";
    const nextRunRaw =
      typeof body?.nextRun === "string" ? body.nextRun : undefined;
    const amount = sanitizeAmount(body?.amount);

    if (rawMerchant.length < 2 || rawMerchant.length > 40)
      return jsonError("Choose or type the merchant for this mandate.", 400);
    const merchant =
      MERCHANTS.find((m) => m.name.toLowerCase() === rawMerchant.toLowerCase())
        ?.name ?? rawMerchant;

    if (frequency !== "WEEKLY" && frequency !== "MONTHLY")
      return jsonError("Choose a weekly or monthly schedule.", 400);
    if (amount === null)
      return jsonError("Enter a valid amount between R0.01 and R10,000,000.", 400);
    if (!fromAccountId)
      return jsonError("Choose which account the mandate deducts from.", 400);

    const from = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: user.id },
    });
    if (!from) return jsonError("That account does not belong to you.", 404);

    let nextRun: Date;
    if (nextRunRaw) {
      const parsed = new Date(nextRunRaw);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(parsed.getTime()) || parsed < today)
        return jsonError("The first run must be today or later.", 400);
      parsed.setHours(9, 0, 0, 0);
      nextRun = parsed;
    } else {
      nextRun = addInterval(new Date(), frequency);
    }

    const order = await prisma.debitOrder.create({
      data: {
        userId: user.id,
        merchant,
        amount,
        frequency,
        nextRun,
        status: "ACTIVE",
        fromAccountId: from.id,
      },
      include: {
        fromAccount: {
          select: { id: true, type: true, number: true, balance: true },
        },
      },
    });

    return Response.json({ order: toView(order) }, { status: 201 });
  } catch (err) {
    console.error("debit order create failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
