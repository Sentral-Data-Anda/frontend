import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PayrollListScreen, payrollTable } from "@/features/sdm/payroll/list";

// Nol gaji di judul tab (SDM §0.3 no. 5): "Penggajian", titik.
function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={payrollTable()} />}
      >
        <PayrollListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/payroll/")({
  head: () => ({ meta: [{ title: withSiteName("Payroll") }] }),
  component: Page,
});
