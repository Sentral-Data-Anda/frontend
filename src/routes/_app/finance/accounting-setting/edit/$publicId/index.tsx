import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { SettingFormScreen } from "@/features/keuangan/setelan-akuntansi/form";

function Page() {
  const { publicId } = Route.useParams();

  return <SettingFormScreen settingKey={publicId} />;
}

export const Route = createFileRoute(
  "/_app/finance/accounting-setting/edit/$publicId/",
)({
  head: () => ({ meta: [{ title: withSiteName("Ubah Accounting Setting") }] }),
  component: Page,
});
