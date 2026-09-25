import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/features/auth";
import { getSession } from "@/features/auth/get-session";
import { AuthHandoffDone } from "@/features/auth/ui";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");

  if (session.status !== "ACTIVE") redirect("/authentication");

  return (
    <SessionProvider session={session}>
      <AppShell>{children}</AppShell>
      <AuthHandoffDone />
    </SessionProvider>
  );
}
