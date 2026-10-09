import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  OfferingTypeListScreen,
  offeringTypeTable,
} from "@/features/keuangan/tipe-persembahan/list";

export const metadata: Metadata = {
  title: "Tipe Persembahan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={offeringTypeTable(false)} />
        }
      >
        <OfferingTypeListScreen />
      </Suspense>
    </PageContainer>
  );
}
