import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PencarianScreen } from "@/features/pencarian";

function Page() {
  return (
    <PageContainer>
      <PencarianScreen />
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/modul/")({
  head: () => ({ meta: [{ title: withSiteName("Pencarian") }] }),
  component: Page,
});
