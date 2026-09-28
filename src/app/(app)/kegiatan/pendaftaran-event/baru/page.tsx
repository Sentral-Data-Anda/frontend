import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PendaftaranFormScreen } from "@/features/kegiatan/pendaftaran-event/form";

export const metadata: Metadata = {
  title: "Daftarkan Peserta",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PendaftaranFormScreen />
    </Suspense>
  );
}
