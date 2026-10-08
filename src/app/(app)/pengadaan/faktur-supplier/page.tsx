import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { InvoiceListScreen } from "@/features/pengadaan/faktur-supplier/list";

export const metadata: Metadata = { title: "Faktur Supplier" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceListScreen />
    </Suspense>
  );
}
