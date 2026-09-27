import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  PermintaanListScreen,
  permintaanTable,
} from "@/features/persetujuan/permintaan-persetujuan/list";

export const metadata: Metadata = {
  title: "Permintaan Persetujuan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList table={permintaanTable("menunggu")} />}
      >
        <PermintaanListScreen />
      </Suspense>
    </PageContainer>
  );
}
