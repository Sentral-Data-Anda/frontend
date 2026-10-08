import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PostingPengadaanScreen } from "@/features/keuangan/jurnal/posting";

export const metadata: Metadata = { title: "Posting Pengadaan" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPengadaanScreen />
    </Suspense>
  );
}
