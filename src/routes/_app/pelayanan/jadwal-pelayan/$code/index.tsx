import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { JadwalPelayanDetailScreen } from "@/features/pelayanan/jadwal-pelayan/detail";

function Page() {
  const { code } = Route.useParams();

  return (
    <PageContainer size="full">
      <JadwalPelayanDetailScreen code={code} />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/pelayanan/jadwal-pelayan/$code/")({
  head: () => ({ meta: [{ title: withSiteName("Jadwal Pelayan") }] }),
  component: Page,
});
