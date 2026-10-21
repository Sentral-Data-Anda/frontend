import type { Metadata } from "next";

import { LoanFormScreen } from "@/features/fasilitas/peminjaman-ruang/form";

export const metadata: Metadata = {
  title: "Ubah Peminjaman",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <LoanFormScreen code={publicId} />;
}
