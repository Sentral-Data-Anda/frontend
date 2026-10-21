import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { TransferFormScreen } from "@/features/keuangan/setoran/form";

export const metadata: Metadata = {
  title: "Catat Bank Deposit",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <TransferFormScreen />
    </Suspense>
  );
}
