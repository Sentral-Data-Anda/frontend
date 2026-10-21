import type { Metadata } from "next";

import { KeluargaFormScreen } from "@/features/kejemaatan/keluarga/form";

export const metadata: Metadata = {
  title: "Tambah Keluarga",
};

export default function Page() {
  return <KeluargaFormScreen />;
}
