import type { Metadata } from "next";

import { AbsensiFormScreen } from "@/features/sdm/absensi-karyawan/form";

export const metadata: Metadata = {
  title: "Tambah Absensi Karyawan",
};

export default function Page() {
  return <AbsensiFormScreen />;
}
