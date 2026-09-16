import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MAX_ACCOUNTS, CREDIT_LIMITS, newAccountNumber } from "@/lib/bank";
import { ACCOUNT_TYPES, jsonError, publicAccount } from "@/lib/api";
import { ACCOUNT_META } from "@/lib/format";
import type { AccountType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Not signed in.", 401);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const rawType = body?.type;
    const type: AccountType | null =
      typeof rawType === "string" && (ACCOUNT_TYPES as string[]).includes(rawType)
        ? (rawType as AccountType)
        : null;
    if (!type)
      return jsonError("Please choose a valid account type.", 400);

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    });
    if (accounts.length >= MAX_ACCOUNTS)
      return jsonError(
        `You already have the maximum of ${MAX_ACCOUNTS} accounts.`,
        400
      );
    if (accounts.some((a) => a.type === type))
      return jsonError(
        `You already have a ${ACCOUNT_META[type as keyof typeof ACCOUNT_META].label} account.`,
        409
      );

    const acc = await prisma.account.create({
      data: {
        userId: user.id,
        number: newAccountNumber(),
        type,
        creditLimit: CREDIT_LIMITS[type as keyof typeof CREDIT_LIMITS],
        balance: 0,
      },
    });

    return Response.json({ account: publicAccount(acc) }, { status: 201 });
  } catch (err) {
    console.error("open account failed:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
