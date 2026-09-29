import type { Metadata } from "next";

import { AccountFormScreen } from "@/features/keuangan/akun/form";

export const metadata: Metadata = {
  title: "Tambah Akun",
};

export default function Page() {
  return <AccountFormScreen />;
}
