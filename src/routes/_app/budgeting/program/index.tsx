import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  ProgramListScreen,
  programTable,
} from "@/features/anggaran/program/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={programTable()} />}
      >
        <ProgramListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/budgeting/program/")({
  head: () => ({ meta: [{ title: withSiteName("Program") }] }),
  component: Page,
});
