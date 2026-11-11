import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { withSiteName } from "@/config/site";
import { ReportFormScreen } from "@/features/anggaran/laporan-budget/form";

function Page() {
  const { publicId } = Route.useParams();

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReportFormScreen publicId={publicId} />
    </Suspense>
  );
}

export const Route = createFileRoute(
  "/_app/report/budget-realization/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Budget Realization") }] }),
  component: Page,
});
