import type { Metadata } from "next";

import { PenyusutanFormScreen } from "@/features/inventaris/penyusutan/form";

export const metadata: Metadata = {
  title: "Buka Periode Penyusutan",
};

export default function Page() {
  return <PenyusutanFormScreen />;
}
