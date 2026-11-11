import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { HolidayFormScreen } from "@/features/pengaturan/hari-libur/form";

function Page() {
  return <HolidayFormScreen />;
}

export const Route = createFileRoute("/_app/settings/holiday/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Holiday") }] }),
  component: Page,
});
