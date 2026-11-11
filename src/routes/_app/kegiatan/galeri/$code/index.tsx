import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { GaleriDetailScreen } from "@/features/kegiatan/galeri/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <GaleriDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kegiatan/galeri/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Galeri") }] }),
  component: Page,
});
