import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { MaintenanceFormScreen } from "@/features/inventaris/siklus-aset/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <MaintenanceFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/fixed-asset/asset-transaction/perawatan/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Catat Perawatan") }] }),
  component: Page,
});
