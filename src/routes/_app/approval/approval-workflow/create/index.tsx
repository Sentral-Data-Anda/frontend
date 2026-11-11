import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SetelanFormScreen } from "@/features/persetujuan/setelan-persetujuan/form";

function Page() {
  return <SetelanFormScreen />;
}

export const Route = createFileRoute(
  "/_app/approval/approval-workflow/create/",
)({
  head: () => ({ meta: [{ title: withSiteName("Tambah Alur Persetujuan") }] }),
  component: Page,
});
