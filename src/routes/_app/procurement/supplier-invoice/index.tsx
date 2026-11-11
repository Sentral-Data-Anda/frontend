import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { InvoiceListScreen } from "@/features/pengadaan/faktur-supplier/list";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceListScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/procurement/supplier-invoice/")({
  head: () => ({ meta: [{ title: withSiteName("Supplier Invoice") }] }),
  component: Page,
});
