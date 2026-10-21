import type { Metadata } from "next";

import { ExpenseFormScreen } from "@/features/keuangan/kas-keluar/form";

export const metadata: Metadata = {
  title: "Ubah Kas Keluar",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <ExpenseFormScreen publicId={publicId} />;
}
