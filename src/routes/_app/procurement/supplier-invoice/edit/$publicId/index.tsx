import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { InvoiceFormScreen } from "@/features/pengadaan/faktur-supplier/form";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceFormScreen publicId={decodeURIComponent(publicId)} />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/supplier-invoice/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Supplier Invoice") }] }),
  component: Page,
});
