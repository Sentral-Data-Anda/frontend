import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { ReportFormScreen } from "@/features/anggaran/laporan-budget/form";

function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReportFormScreen />
    </Suspense>
  );
}

export const Route = createFileRoute("/_app/report/budget-realization/create/")(
  {
    head: () => ({
      meta: [{ title: withSiteName("Tambah Budget Realization") }],
    }),
    component: Page,
  },
);
