import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { StockFormScreen } from "@/features/inventaris/barang-persediaan/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <StockFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/inventory/stock-item/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Stock Item") }] }),
  component: Page,
});
