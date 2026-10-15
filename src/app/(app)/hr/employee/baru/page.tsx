import type { Metadata } from "next";

import { KaryawanFormScreen } from "@/features/sdm/karyawan/form";

export const metadata: Metadata = {
  title: "Tambah Employee",
};

export default function Page() {
  return <KaryawanFormScreen />;
}
