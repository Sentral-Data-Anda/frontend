import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { KeluargaFormScreen } from "@/features/kejemaatan/keluarga/form";

function Page() {
  return <KeluargaFormScreen />;
}

export const Route = createFileRoute("/_app/kejemaatan/keluarga/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Keluarga") }] }),
  component: Page,
});
