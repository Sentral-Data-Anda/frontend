import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { TransferFormScreen } from "@/features/inventaris/siklus-aset/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <TransferFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/fixed-asset/asset-transaction/pindah/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Pindahkan Barang") }] }),
  component: Page,
});
