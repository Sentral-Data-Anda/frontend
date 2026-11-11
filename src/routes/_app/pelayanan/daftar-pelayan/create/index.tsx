import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { DaftarPelayanFormScreen } from "@/features/pelayanan/daftar-pelayan/form";

function Page() {
  return <DaftarPelayanFormScreen />;
}

export const Route = createFileRoute("/_app/pelayanan/daftar-pelayan/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Pelayan") }] }),
  component: Page,
});
