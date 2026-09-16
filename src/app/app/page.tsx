import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Dashboard from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard — Meridian Bank" };

export default async function AppPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <Dashboard user={user} />;
}
