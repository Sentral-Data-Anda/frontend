import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SkillMusikFormScreen } from "@/features/pelayanan/skill-musik/form";

function Page() {
  const { publicId } = Route.useParams();

  return <SkillMusikFormScreen id={publicId} />;
}

export const Route = createFileRoute(
  "/_app/pelayanan/skill-musik/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Alat Musik") }] }),
  component: Page,
});
