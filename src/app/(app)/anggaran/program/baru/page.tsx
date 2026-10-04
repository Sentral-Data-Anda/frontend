import type { Metadata } from "next";

import { ProgramFormScreen } from "@/features/anggaran/program/form";

export const metadata: Metadata = {
  title: "Tambah Program",
};

export default function Page() {
  return <ProgramFormScreen />;
}
