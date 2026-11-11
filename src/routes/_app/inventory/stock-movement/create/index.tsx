import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { MutasiFormScreen } from "@/features/inventaris/mutasi-stok/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <MutasiFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/inventory/stock-movement/create/")({
  head: () => ({ meta: [{ title: withSiteName("Catat Stock Movement") }] }),
  component: Page,
});
