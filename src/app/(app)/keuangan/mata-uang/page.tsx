import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  CurrencyListScreen,
  currencyTable,
} from "@/features/keuangan/mata-uang/list";

export const metadata: Metadata = {
  title: "Mata Uang",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={currencyTable()} />}>
        <CurrencyListScreen />
      </Suspense>
    </PageContainer>
  );
}
