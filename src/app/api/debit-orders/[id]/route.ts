import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import type { DebitOrderView } from "@/lib/types";

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

/** Pause / resume / cancel a debit order mandate. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Not signed in.", 401);

    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const action = body?.action;

    const order = await prisma.debitOrder.findFirst({
      where: { id, userId: user.id },
      include: {
        fromAccount: {
          select: { id: true, type: true, number: true, balance: true },
        },
      },
    });
    if (!order) return jsonError("Debit order not found.", 404);

    let status: "ACTIVE" | "PAUSED" | "CANCELLED";
    if (action === "pause") {
      if (order.status !== "ACTIVE")
        return jsonError("Only active mandates can be paused.", 400);
      status = "PAUSED";
    } else if (action === "resume") {
      if (order.status !== "PAUSED")
        return jsonError("Only paused mandates can be resumed.", 400);
      status = "ACTIVE";
    } else if (action === "cancel") {
      if (order.status === "CANCELLED")
        return jsonError("This mandate is already cancelled.", 400);
      status = "CANCELLED";
    } else {
      return jsonError("Unknown action.", 400);
    }

    const updated = await prisma.debitOrder.update({
      where: { id },
      data: { status },
      include: {
        fromAccount: {
          select: { id: true, type: true, number: true, balance: true },
        },
      },
    });

    return Response.json({ order: toView(updated) });
  } catch (err) {
    console.error("debit order update failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
