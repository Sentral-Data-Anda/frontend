import type { Metadata } from "next";

import { TipeIbadahFormScreen } from "@/features/peribadahan/tipe-ibadah/form";

export const metadata: Metadata = {
  title: "Tambah Tipe Ibadah",
};

export default function Page() {
  return <TipeIbadahFormScreen />;
}
