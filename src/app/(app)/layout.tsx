import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/features/auth";
import { getSession } from "@/features/auth/get-session";
import { SentryUser } from "@/features/observability";
import { SESSION_ENDED_PATH } from "@/lib/api/cookie";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect(SESSION_ENDED_PATH);

  if (session.status !== "ACTIVE") redirect("/authentication");

  return (
    <SessionProvider session={session}>
      <SentryUser />
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
