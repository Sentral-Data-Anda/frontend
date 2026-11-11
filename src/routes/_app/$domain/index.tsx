import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { resolveDomain } from "@/config/resolve-domain";
import { withSiteName } from "@/config/site";
import { sessionQuery } from "@/features/auth";
import { DomainScreen } from "@/features/domain";

const DomainPage = () => {
  const { domain } = Route.useRouteContext();

  return (
    <PageContainer>
      <DomainScreen domain={domain} />
    </PageContainer>
  );
};

export const Route = createFileRoute("/_app/$domain/")({
  // Slug yang bukan domain, atau domain yang tidak dipegang sesi ini: 404.
  beforeLoad: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);
    const result = resolveDomain(session?.menu ?? [], params.domain);

    if (result.kind === "not-found") throw notFound();
    if (result.kind === "redirect") throw redirect({ href: result.href });

    return { domain: result.domain };
  },
  head: ({ match }) => ({
    meta: [{ title: withSiteName(match.context.domain.name) }],
  }),
  component: DomainPage,
});
