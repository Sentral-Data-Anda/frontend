import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { RuangDetailScreen } from "@/features/fasilitas/ruang/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <RuangDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/fasilitas/ruang/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Ruang") }] }),
  component: Page,
});
