import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { OpnameFormScreen } from "@/features/inventaris/stok-opname/form";

export const metadata: Metadata = {
  title: "Tambah Stok Opname",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <OpnameFormScreen />
    </Suspense>
  );
}
