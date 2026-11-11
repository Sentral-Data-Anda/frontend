import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { LoadingGlobal } from "@/components/common/feedback";
import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider, sessionQuery } from "@/features/auth";

import { AppNotFound } from "../-ui/app-not-found";

const AppLayout = () => {
  const { data: session } = useSuspenseQuery(sessionQuery);

  if (!session) return <Navigate to="/login" replace />;

  return (
    <SessionProvider session={session}>
      <AppShell>
        <Outlet />
      </AppShell>
    </SessionProvider>
  );
};

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);

    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    if (session.status !== "ACTIVE") throw redirect({ to: "/authentication" });
  },
  component: AppLayout,
  pendingComponent: LoadingGlobal,
  notFoundComponent: AppNotFound,
});
