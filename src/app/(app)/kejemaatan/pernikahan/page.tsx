import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  marriageTable,
  MarriageListScreen,
} from "@/features/kejemaatan/pernikahan/list";

export const metadata: Metadata = {
  title: "Pernikahan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={marriageTable(false)} />
        }
      >
        <MarriageListScreen />
      </Suspense>
    </PageContainer>
  );
}
