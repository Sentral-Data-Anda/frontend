import type { Metadata } from "next";

import { KontrakFormScreen } from "@/features/sdm/kontrak-karyawan/form";

export const metadata: Metadata = {
  title: "Tambah Kontrak Karyawan",
};

export default function Page() {
  return <KontrakFormScreen />;
}
