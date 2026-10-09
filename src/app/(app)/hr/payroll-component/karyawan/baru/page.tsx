import type { Metadata } from "next";

import { PenetapanFormScreen } from "@/features/sdm/komponen-payroll/form";

export const metadata: Metadata = {
  title: "Tambah Penetapan Komponen",
};

export default function Page() {
  return <PenetapanFormScreen />;
}
