import type { Metadata } from "next";

import { TipeCutiFormScreen } from "@/features/sdm/tipe-cuti/form";

export const metadata: Metadata = {
  title: "Tambah Tipe Cuti",
};

export default function Page() {
  return <TipeCutiFormScreen />;
}
