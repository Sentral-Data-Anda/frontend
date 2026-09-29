import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { StockFormScreen } from "@/features/inventaris/barang-persediaan/form";

export const metadata: Metadata = {
  title: "Tambah Barang Persediaan",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <StockFormScreen />
    </Suspense>
  );
}
