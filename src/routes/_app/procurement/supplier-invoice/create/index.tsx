import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { InvoiceFormScreen } from "@/features/pengadaan/faktur-supplier/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/supplier-invoice/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tambah Supplier Invoice") }] }),
  component: Page,
});
