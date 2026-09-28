import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PengumumanFormScreen } from "@/features/kegiatan/pengumuman/form";

export const metadata: Metadata = {
  title: "Buat Pengumuman",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PengumumanFormScreen />
    </Suspense>
  );
}
