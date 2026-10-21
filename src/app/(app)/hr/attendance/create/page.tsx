import type { Metadata } from "next";

import { AbsensiFormScreen } from "@/features/sdm/absensi-karyawan/form";

export const metadata: Metadata = {
  title: "Tambah Attendance",
};

export default function Page() {
  return <AbsensiFormScreen />;
}
