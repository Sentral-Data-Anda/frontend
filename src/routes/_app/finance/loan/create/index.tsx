import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PinjamanFormScreen } from "@/features/keuangan/pinjaman";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PinjamanFormScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/loan/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Pinjaman") }] }),
  component: Page,
});
