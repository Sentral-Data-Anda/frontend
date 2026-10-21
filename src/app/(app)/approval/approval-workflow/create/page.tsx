import type { Metadata } from "next";

import { SetelanFormScreen } from "@/features/persetujuan/setelan-persetujuan/form";

export const metadata: Metadata = {
  title: "Tambah Alur Persetujuan",
};

export default function Page() {
  return <SetelanFormScreen />;
}
