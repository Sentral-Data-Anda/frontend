import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { ProgramFormScreen } from "@/features/anggaran/program/form";

function Page() {
  return <ProgramFormScreen />;
}

export const Route = createFileRoute("/_app/budgeting/program/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Program") }] }),
  component: Page,
});
