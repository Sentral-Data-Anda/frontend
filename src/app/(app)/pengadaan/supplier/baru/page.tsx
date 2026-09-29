import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { SupplierFormScreen } from "@/features/pengadaan/supplier/form";

export const metadata: Metadata = {
  title: "Tambah Supplier",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <SupplierFormScreen />
    </Suspense>
  );
}
