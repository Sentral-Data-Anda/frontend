import type { Metadata } from "next";

import { JemaatFormScreen } from "@/features/kejemaatan/daftar-jemaat";

export const metadata: Metadata = {
  title: "Ubah Jemaat",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <JemaatFormScreen code={code} />;
}
