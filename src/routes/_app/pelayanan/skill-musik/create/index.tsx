import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SkillMusikFormScreen } from "@/features/pelayanan/skill-musik/form";

function Page() {
  return <SkillMusikFormScreen />;
}

export const Route = createFileRoute("/_app/pelayanan/skill-musik/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Alat Musik") }] }),
  component: Page,
});
