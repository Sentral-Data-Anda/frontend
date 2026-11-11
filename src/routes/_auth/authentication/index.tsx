import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoadingPage } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { sessionQuery } from "@/features/auth";
import { FirstLoginScreen } from "@/features/auth/ui";
import { SESSION_ENDED_PATH } from "@/lib/api/session";
import { isSafeRedirectPath } from "@/lib/redirect";

import { validateAuthSearch } from "../../-ui/auth-search";

// Keputusan user: animasi layar tunggu tampil utuh (150ms jeda + 800ms gerak).
const hold = () => new Promise((resolve) => setTimeout(resolve, 1_000));

const FirstLoginPage = () => (
  <FirstLoginScreen code={Route.useRouteContext().session.code} />
);

export const Route = createFileRoute("/_auth/authentication/")({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ context: { queryClient }, search }) => {
    const [session] = await Promise.all([
      queryClient.fetchQuery({ ...sessionQuery, staleTime: 0 }),
      hold(),
    ]);
    const target = isSafeRedirectPath(search.redirect) ? search.redirect : "/";

    if (session?.status === "ACTIVE") throw redirect({ href: target });
    if (session?.status !== "PENDING")
      throw redirect({ href: SESSION_ENDED_PATH });

    return { session };
  },
  head: () => ({ meta: [{ title: withSiteName("Menyiapkan") }] }),
  component: FirstLoginPage,
  pendingComponent: () => <LoadingPage tone="brand" />,
  pendingMs: 0,
});
