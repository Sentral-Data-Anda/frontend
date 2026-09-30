import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  ExpenseListScreen,
  expenseTable,
} from "@/features/keuangan/kas-keluar/list";

export const metadata: Metadata = {
  title: "Kas Keluar",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={expenseTable()} />}>
        <ExpenseListScreen />
      </Suspense>
    </PageContainer>
  );
}
