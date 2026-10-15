import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { AccountListScreen, accountTable } from "@/features/keuangan/akun/list";

export const metadata: Metadata = {
  title: "Chart of Account",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={accountTable()} />}>
        <AccountListScreen />
      </Suspense>
    </PageContainer>
  );
}
