import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { JournalFormScreen } from "@/features/keuangan/jurnal/form";

export const metadata: Metadata = {
  title: "Tambah Entri Jurnal",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <JournalFormScreen />
    </Suspense>
  );
}
