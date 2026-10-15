import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { InvoiceFormScreen } from "@/features/pengadaan/faktur-supplier/form";

export const metadata: Metadata = { title: "Tambah Supplier Invoice" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <InvoiceFormScreen />
    </Suspense>
  );
}
