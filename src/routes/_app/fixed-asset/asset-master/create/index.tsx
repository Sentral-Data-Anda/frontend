import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { BarangFormScreen } from "@/features/inventaris/barang/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <BarangFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/fixed-asset/asset-master/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Asset Master") }] }),
  component: Page,
});
