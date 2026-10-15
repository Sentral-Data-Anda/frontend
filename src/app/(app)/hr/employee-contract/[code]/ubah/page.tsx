import type { Metadata } from "next";

import { KontrakFormScreen } from "@/features/sdm/kontrak-karyawan/form";

export const metadata: Metadata = {
  title: "Ubah Employee Contract",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <KontrakFormScreen code={code} />;
}
