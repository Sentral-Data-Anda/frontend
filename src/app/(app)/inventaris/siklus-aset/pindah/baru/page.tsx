import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { TransferFormScreen } from "@/features/inventaris/siklus-aset/form";

export const metadata: Metadata = {
  title: "Pindahkan Barang",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <TransferFormScreen />
    </Suspense>
  );
}
