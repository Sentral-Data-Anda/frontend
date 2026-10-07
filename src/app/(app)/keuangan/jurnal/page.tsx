import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  JournalListScreen,
  journalTable,
} from "@/features/keuangan/jurnal/list";

export const metadata: Metadata = {
  title: "Jurnal",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={journalTable()} />}
      >
        <JournalListScreen />
      </Suspense>
    </PageContainer>
  );
}
