import type { Metadata } from "next";

import { JemaatFormScreen } from "@/features/kejemaatan/daftar-jemaat/form-screen";

export const metadata: Metadata = {
  title: "Ubah Jemaat",
};

/**
 * `[code]` adalah kode jemaat (`JMT-…`), bukan `publicId`: itu satu-satunya
 * pengenal yang dikirim endpoint daftar, dan rute ini dibuka dari sana.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <JemaatFormScreen code={code} />;
}
