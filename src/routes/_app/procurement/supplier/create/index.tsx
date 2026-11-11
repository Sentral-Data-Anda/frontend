import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { SupplierFormScreen } from "@/features/pengadaan/supplier/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <SupplierFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/procurement/supplier/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Supplier") }] }),
  component: Page,
});
