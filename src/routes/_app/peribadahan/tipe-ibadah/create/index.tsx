import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TipeIbadahFormScreen } from "@/features/peribadahan/tipe-ibadah/form";

function Page() {
  return <TipeIbadahFormScreen />;
}

export const Route = createFileRoute("/_app/peribadahan/tipe-ibadah/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Tipe Ibadah") }] }),
  component: Page,
});
