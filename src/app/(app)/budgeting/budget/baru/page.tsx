import type { Metadata } from "next";

import { AllocationFormScreen } from "@/features/anggaran/pagu-anggaran/form";

export const metadata: Metadata = {
  title: "Tambah Pagu Anggaran",
};

export default function Page() {
  return <AllocationFormScreen />;
}
