import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { RequestFormScreen } from "@/features/pengadaan/permintaan-pembelian/form";

export const metadata: Metadata = {
  title: "Tambah Permintaan Pembelian",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <RequestFormScreen />
    </Suspense>
  );
}
