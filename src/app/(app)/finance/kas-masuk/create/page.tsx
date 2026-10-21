import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReceiptFormScreen } from "@/features/keuangan/kas-masuk/form";

export const metadata: Metadata = {
  title: "Tambah Kas Masuk",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReceiptFormScreen />
    </Suspense>
  );
}
