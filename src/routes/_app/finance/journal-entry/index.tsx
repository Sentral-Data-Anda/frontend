import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  JournalListScreen,
  journalTable,
} from "@/features/keuangan/jurnal/list";

function Page() {
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

export const Route = createFileRoute("/_app/finance/journal-entry/")({
  head: () => ({ meta: [{ title: withSiteName("Journal Entry") }] }),
  component: Page,
});
