import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { AllocationFormScreen } from "@/features/anggaran/pagu-anggaran/form";

function Page() {
  const { publicId } = Route.useParams();

  return <AllocationFormScreen publicId={publicId} />;
}

export const Route = createFileRoute("/_app/budgeting/budget/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Budget") }] }),
  component: Page,
});
