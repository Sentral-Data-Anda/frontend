import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { PayrollListScreen, payrollTable } from "@/features/sdm/payroll/list";

// Nol gaji di judul tab (SDM §0.3 no. 5): "Penggajian", titik.
export const metadata: Metadata = {
  title: "Penggajian",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={payrollTable()} />}>
        <PayrollListScreen />
      </Suspense>
    </PageContainer>
  );
}
