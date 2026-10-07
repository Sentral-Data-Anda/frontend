import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  keluargaTable,
  KeluargaListScreen,
} from "@/features/kejemaatan/keluarga/list";

export const metadata: Metadata = {
  title: "Keluarga",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={keluargaTable(false)} />
        }
      >
        <KeluargaListScreen />
      </Suspense>
    </PageContainer>
  );
}
