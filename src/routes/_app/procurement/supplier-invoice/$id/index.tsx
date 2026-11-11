import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { InvoiceDetailScreen } from "@/features/pengadaan/faktur-supplier/detail";

function Page() {
  const { id } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceDetailScreen publicId={decodeURIComponent(id)} />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/procurement/supplier-invoice/$id/")(
  {
    head: () => ({ meta: [{ title: withSiteName("Supplier Invoice") }] }),
    component: Page,
  },
);
