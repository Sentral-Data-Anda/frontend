import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingList } from "@/components/common/loading-list";
import { PageContainer } from "@/components/layout/page-container";

import { JemaatListScreen } from "./jemaat-list-screen";

export const metadata: Metadata = {
  title: "Daftar Jemaat",
};

/**
 * Rute statis ini menang atas `(app)/[domain]/[screen]` yang memanggil
 * `notFound()`, jadi tidak ada daftar yang perlu diperbarui saat satu layar
 * selesai dibangun.
 *
 * `Suspense` wajib, bukan hiasan: `JemaatListScreen` memakai `useListParams`,
 * yang di dalamnya ada `useSearchParams`. Tanpa boundary, Next menolak
 * mem-build halaman ini ("useSearchParams() should be wrapped in a suspense
 * boundary") — kegagalan yang muncul saat `next build`, bukan saat `next dev`.
 */
export default function Page() {
  return (
    <PageContainer>
      <Suspense fallback={<LoadingList />}>
        <JemaatListScreen />
      </Suspense>
    </PageContainer>
  );
}
