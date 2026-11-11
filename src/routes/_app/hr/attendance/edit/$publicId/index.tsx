import { createFileRoute } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { AbsensiFormScreen } from "@/features/sdm/absensi-karyawan/form";

function Page() {
  const { publicId } = Route.useParams();

  return <AbsensiFormScreen publicId={publicId} />;
}

export const Route = createFileRoute("/_app/hr/attendance/edit/$publicId/")({
  head: () => ({ meta: [{ title: withSiteName("Ubah Attendance") }] }),
  component: Page,
});
