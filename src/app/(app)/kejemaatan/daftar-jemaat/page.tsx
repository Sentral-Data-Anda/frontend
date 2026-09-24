import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list/loading-list";
import { PageContainer } from "@/components/layout/page-container";
import { JemaatListScreen } from "@/features/kejemaatan/daftar-jemaat/screen";
import { jemaatTable } from "@/features/kejemaatan/daftar-jemaat/ui/list-item";

export const metadata: Metadata = {
  title: "Daftar Jemaat",
};

/**
 * Rute statis ini menang atas `(app)/[domain]/[screen]` yang memanggil
 * `notFound()`. `Suspense` wajib: layarnya memakai `useSearchParams`, dan
 * tanpa boundary `next build` menolak halaman ini.
 */
export default function Page() {
  return (
    <PageContainer size="wide">
      <Suspense fallback={<LoadingDataList table={jemaatTable(false)} />}>
        <JemaatListScreen />
      </Suspense>
    </PageContainer>
  );
}
