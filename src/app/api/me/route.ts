import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonError, publicAccount } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Not signed in.", 401);

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ user, accounts: accounts.map(publicAccount) });
}
