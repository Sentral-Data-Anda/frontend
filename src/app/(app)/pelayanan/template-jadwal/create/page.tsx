import type { Metadata } from "next";

import { TemplateJadwalFormScreen } from "@/features/pelayanan/template-jadwal/form";

export const metadata: Metadata = {
  title: "Tambah Template Jadwal",
};

export default function Page() {
  return <TemplateJadwalFormScreen />;
}
