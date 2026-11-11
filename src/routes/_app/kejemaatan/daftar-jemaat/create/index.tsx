import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { JemaatFormScreen } from "@/features/kejemaatan/daftar-jemaat/form";

function Page() {
  return <JemaatFormScreen />;
}

export const Route = createFileRoute("/_app/kejemaatan/daftar-jemaat/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Jemaat") }] }),
  component: Page,
});
