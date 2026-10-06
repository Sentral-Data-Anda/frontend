import type { Metadata } from "next";

import { KontrakFormScreen } from "@/features/sdm/kontrak-karyawan/form";

export const metadata: Metadata = {
  title: "Ubah Kontrak Karyawan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <KontrakFormScreen code={code} />;
}
