import type { Metadata } from "next";

import { TipeCutiFormScreen } from "@/features/sdm/tipe-cuti/form";

export const metadata: Metadata = {
  title: "Tambah Leave Type",
};

export default function Page() {
  return <TipeCutiFormScreen />;
}
