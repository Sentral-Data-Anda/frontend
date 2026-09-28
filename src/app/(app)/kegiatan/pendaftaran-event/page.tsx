import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  PendaftaranListScreen,
  pendaftaranTable,
} from "@/features/kegiatan/pendaftaran-event/list";

export const metadata: Metadata = {
  title: "Pendaftaran Event",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={pendaftaranTable()} />}>
        <PendaftaranListScreen />
      </Suspense>
    </PageContainer>
  );
}
