import type { Metadata } from "next";

import { CurrencyFormScreen } from "@/features/keuangan/mata-uang/form";

export const metadata: Metadata = {
  title: "Tambah Mata Uang",
};

export default function Page() {
  return <CurrencyFormScreen />;
}
