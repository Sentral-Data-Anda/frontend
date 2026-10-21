import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { JadwalPelayanFormScreen } from "@/features/pelayanan/jadwal-pelayan/form";

export const metadata: Metadata = {
  title: "Tambah Jadwal Pelayan",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <JadwalPelayanFormScreen />
    </Suspense>
  );
}
