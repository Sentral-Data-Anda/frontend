import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReportFormScreen } from "@/features/anggaran/laporan-budget/form";

export const metadata: Metadata = {
  title: "Tambah Laporan Budget",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReportFormScreen />
    </Suspense>
  );
}
