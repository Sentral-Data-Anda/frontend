import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  ProgramListScreen,
  programTable,
} from "@/features/anggaran/program/list";

export const metadata: Metadata = {
  title: "Program",
};

export default function Page() {
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
