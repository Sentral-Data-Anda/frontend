import type { Metadata } from "next";

import { RuangFormScreen } from "@/features/fasilitas/ruang/form";

export const metadata: Metadata = {
  title: "Ubah Ruang",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <RuangFormScreen code={publicId} />;
}
