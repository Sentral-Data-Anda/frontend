import type { Metadata } from "next";

import { TemplateJadwalFormScreen } from "@/features/pelayanan/template-jadwal/form";

export const metadata: Metadata = {
  title: "Ubah Template Jadwal",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <TemplateJadwalFormScreen code={code} />;
}
