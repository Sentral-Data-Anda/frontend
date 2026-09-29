import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { OrderFormScreen } from "@/features/pengadaan/pesanan-pembelian/form";

export const metadata: Metadata = {
  title: "Tambah Pesanan Pembelian",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <OrderFormScreen />
    </Suspense>
  );
}
