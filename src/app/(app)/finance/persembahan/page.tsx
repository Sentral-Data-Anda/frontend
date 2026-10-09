import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  PersembahanListScreen,
  persembahanTable,
} from "@/features/keuangan/persembahan/list";

export const metadata: Metadata = {
  title: "Persembahan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={persembahanTable(false)} />
        }
      >
        <PersembahanListScreen />
      </Suspense>
    </PageContainer>
  );
}
