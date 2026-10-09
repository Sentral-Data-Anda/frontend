import type { Metadata } from "next";

import { ExpenseFormScreen } from "@/features/keuangan/kas-keluar/form";

export const metadata: Metadata = {
  title: "Ubah Kas Keluar",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ExpenseFormScreen publicId={id} />;
}
