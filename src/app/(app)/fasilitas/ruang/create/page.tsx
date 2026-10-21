import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { RuangFormScreen } from "@/features/fasilitas/ruang/form";

export const metadata: Metadata = {
  title: "Tambah Ruang",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <RuangFormScreen />
    </Suspense>
  );
}
