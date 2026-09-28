import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  TemplateJadwalListScreen,
  templateJadwalTable,
} from "@/features/pelayanan/template-jadwal/list";

export const metadata: Metadata = {
  title: "Template Jadwal",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList table={templateJadwalTable(false)} />}
      >
        <TemplateJadwalListScreen />
      </Suspense>
    </PageContainer>
  );
}
