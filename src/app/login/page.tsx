import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in Meridian Bank" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/app");
  return <AuthForm mode="login" />;
}
