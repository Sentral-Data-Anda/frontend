import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { MaintenanceFormScreen } from "@/features/inventaris/siklus-aset/form";

export const metadata: Metadata = {
  title: "Catat Perawatan",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <MaintenanceFormScreen />
    </Suspense>
  );
}
