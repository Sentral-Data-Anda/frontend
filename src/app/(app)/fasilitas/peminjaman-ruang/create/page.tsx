import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { LoanFormScreen } from "@/features/fasilitas/peminjaman-ruang/form";

export const metadata: Metadata = {
  title: "Tambah Peminjaman",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <LoanFormScreen />
    </Suspense>
  );
}
