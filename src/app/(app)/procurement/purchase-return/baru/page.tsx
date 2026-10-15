import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReturnFormScreen } from "@/features/pengadaan/retur-pembelian/form";

export const metadata: Metadata = {
  title: "Tambah Retur Pembelian",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReturnFormScreen />
    </Suspense>
  );
}
