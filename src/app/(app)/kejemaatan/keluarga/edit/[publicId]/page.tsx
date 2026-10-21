import type { Metadata } from "next";

import { KeluargaFormScreen } from "@/features/kejemaatan/keluarga/form";

export const metadata: Metadata = {
  title: "Ubah Keluarga",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <KeluargaFormScreen code={publicId} />;
}
