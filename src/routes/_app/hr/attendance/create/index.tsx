import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { AbsensiFormScreen } from "@/features/sdm/absensi-karyawan/form";

function Page() {
  return <AbsensiFormScreen />;
}

export const Route = createFileRoute("/_app/hr/attendance/create/")({
  head: () => ({ meta: [{ title: withSiteName("Tambah Attendance") }] }),
  component: Page,
});
