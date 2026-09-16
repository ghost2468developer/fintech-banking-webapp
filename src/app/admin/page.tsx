import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminConsole from "@/components/admin/AdminConsole";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin console — Meridian Bank" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/app");
  return <AdminConsole user={user} />;
}
