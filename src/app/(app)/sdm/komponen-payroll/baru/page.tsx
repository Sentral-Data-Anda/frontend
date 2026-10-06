import type { Metadata } from "next";

import { KatalogFormScreen } from "@/features/sdm/komponen-payroll/form";

export const metadata: Metadata = {
  title: "Tambah Komponen Payroll",
};

export default function Page() {
  return <KatalogFormScreen />;
}
