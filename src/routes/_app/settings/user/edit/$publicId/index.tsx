import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { UserFormScreen } from "@/features/pengaturan/user/form";

function Page() {
  const { publicId } = Route.useParams();

  return <UserFormScreen code={publicId} />;
}

export const Route = createFileRoute("/_app/settings/user/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Detail Akun") }] }),
  component: Page,
});
