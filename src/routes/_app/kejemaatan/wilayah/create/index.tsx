import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { WilayahFormScreen } from "@/features/kejemaatan/wilayah/form";

function Page() {
  return <WilayahFormScreen />;
}

export const Route = createFileRoute("/_app/kejemaatan/wilayah/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Wilayah") }] }),
  component: Page,
});
