import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { BapelFormScreen } from "@/features/kejemaatan/bapel/form";

function Page() {
  return <BapelFormScreen />;
}

export const Route = createFileRoute("/_app/kejemaatan/bapel/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Badan Pelayanan") }] }),
  component: Page,
});
