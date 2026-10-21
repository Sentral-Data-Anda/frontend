import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { GaleriFormScreen } from "@/features/kegiatan/galeri/form";

export const metadata: Metadata = {
  title: "Tambah Album",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <GaleriFormScreen />
    </Suspense>
  );
}
