import type { Metadata } from "next";

import { CurrencyFormScreen } from "@/features/keuangan/mata-uang/form";

export const metadata: Metadata = {
  title: "Tambah Currency",
};

export default function Page() {
  return <CurrencyFormScreen />;
}
