import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { ReturnFormScreen } from "@/features/pengadaan/retur-pembelian/form";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReturnFormScreen publicId={publicId} />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/procurement/purchase-return/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Purchase Return") }] }),
  component: Page,
});
