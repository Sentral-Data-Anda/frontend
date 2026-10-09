import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { DisposalFormScreen } from "@/features/inventaris/siklus-aset/form";

export const metadata: Metadata = {
  title: "Ajukan Pelepasan",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <DisposalFormScreen />
    </Suspense>
  );
}
