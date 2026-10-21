import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { MutasiFormScreen } from "@/features/inventaris/mutasi-stok/form";

export const metadata: Metadata = {
  title: "Catat Stock Movement",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <MutasiFormScreen />
    </Suspense>
  );
}
