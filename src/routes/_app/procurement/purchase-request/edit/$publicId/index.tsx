import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { RequestFormScreen } from "@/features/pengadaan/permintaan-pembelian/form";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <RequestFormScreen code={publicId} />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/purchase-request/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Purchase Request") }] }),
  component: Page,
});
