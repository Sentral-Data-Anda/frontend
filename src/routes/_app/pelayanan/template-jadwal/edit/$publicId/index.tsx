import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { TemplateJadwalFormScreen } from "@/features/pelayanan/template-jadwal/form";

function Page() {
  const { publicId } = Route.useParams();

  return <TemplateJadwalFormScreen code={publicId} />;
}

export const Route = createFileRoute(
  "/_app/pelayanan/template-jadwal/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Template Jadwal") }] }),
  component: Page,
});
