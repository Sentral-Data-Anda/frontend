import type { Metadata } from "next";

import { SatuanFormScreen } from "@/features/inventaris/satuan/form";

export const metadata: Metadata = {
  title: "Tambah Satuan",
};

export default function Page() {
  return <SatuanFormScreen />;
}
