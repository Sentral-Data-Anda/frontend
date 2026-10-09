import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReceiptFormScreen } from "@/features/pengadaan/penerimaan-barang/form";

export const metadata: Metadata = {
  title: "Catat Penerimaan Barang",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReceiptFormScreen />
    </Suspense>
  );
}
