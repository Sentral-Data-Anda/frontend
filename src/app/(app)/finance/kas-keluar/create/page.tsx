import type { Metadata } from "next";

import { ExpenseFormScreen } from "@/features/keuangan/kas-keluar/form";

export const metadata: Metadata = {
  title: "Tambah Kas Keluar",
};

export default function Page() {
  return <ExpenseFormScreen />;
}
