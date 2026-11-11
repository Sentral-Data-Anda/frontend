import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TemplateJadwalFormScreen } from "@/features/pelayanan/template-jadwal/form";

function Page() {
  return <TemplateJadwalFormScreen />;
}

export const Route = createFileRoute("/_app/pelayanan/template-jadwal/create/")(
  {
    head: () => ({ meta: [{ title: withSiteName("Tambah Template Jadwal") }] }),
    component: Page,
  },
);
