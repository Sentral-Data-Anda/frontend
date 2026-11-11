import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { ProgramFormScreen } from "@/features/anggaran/program/form";

function Page() {
  const { publicId } = Route.useParams();

  return <ProgramFormScreen publicId={publicId} />;
}

export const Route = createFileRoute("/_app/budgeting/program/edit/$publicId/")(
  {
    head: () => ({ meta: [{ title: withSiteName("Ubah Program") }] }),
    component: Page,
  },
);
