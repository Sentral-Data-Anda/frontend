import type { Metadata } from "next";

import { KeluargaFormScreen } from "@/features/kejemaatan/keluarga/form";

export const metadata: Metadata = {
  title: "Ubah Keluarga",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <KeluargaFormScreen code={code} />;
}
