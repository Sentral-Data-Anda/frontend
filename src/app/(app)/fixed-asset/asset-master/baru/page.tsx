import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { BarangFormScreen } from "@/features/inventaris/barang/form";

export const metadata: Metadata = {
  title: "Tambah Barang",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <BarangFormScreen />
    </Suspense>
  );
}
