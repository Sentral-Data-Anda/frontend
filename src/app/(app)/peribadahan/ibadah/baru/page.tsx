import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { IbadahFormScreen } from "@/features/peribadahan/ibadah/form";

export const metadata: Metadata = {
  title: "Tambah Ibadah",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <IbadahFormScreen />
    </Suspense>
  );
}
