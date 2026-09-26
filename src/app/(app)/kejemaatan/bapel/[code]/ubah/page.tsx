import type { Metadata } from "next";

import { BapelFormScreen } from "@/features/kejemaatan/bapel/form";

export const metadata: Metadata = {
  title: "Ubah Badan Pelayanan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <BapelFormScreen code={code} />;
}
