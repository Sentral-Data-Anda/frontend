import type { Metadata } from "next";

import { BapelFormScreen } from "@/features/kejemaatan/bapel/form";

export const metadata: Metadata = {
  title: "Tambah Badan Pelayanan",
};

export default function Page() {
  return <BapelFormScreen />;
}
