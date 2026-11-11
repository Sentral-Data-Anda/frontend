import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { AllocationFormScreen } from "@/features/anggaran/pagu-anggaran/form";

function Page() {
  return <AllocationFormScreen />;
}

export const Route = createFileRoute("/_app/budgeting/budget/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Budget") }] }),
  component: Page,
});
