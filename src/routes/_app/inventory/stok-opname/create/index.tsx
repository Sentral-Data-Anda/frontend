import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { OpnameFormScreen } from "@/features/inventaris/stok-opname/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <OpnameFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/inventory/stok-opname/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Stok Opname") }] }),
  component: Page,
});
