import type { Metadata } from "next";

import { KaryawanFormScreen } from "@/features/sdm/karyawan/form";

export const metadata: Metadata = {
  title: "Tambah Karyawan",
};

export default function Page() {
  return <KaryawanFormScreen />;
}
