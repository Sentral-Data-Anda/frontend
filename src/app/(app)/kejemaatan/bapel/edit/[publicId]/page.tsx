import type { Metadata } from "next";

import { BapelFormScreen } from "@/features/kejemaatan/bapel/form";

export const metadata: Metadata = {
  title: "Ubah Badan Pelayanan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <BapelFormScreen code={publicId} />;
}
