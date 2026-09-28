import type { Metadata } from "next";

import { LoanFormScreen } from "@/features/fasilitas/peminjaman-ruang/form";

export const metadata: Metadata = {
  title: "Ubah Peminjaman",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <LoanFormScreen code={code} />;
}
