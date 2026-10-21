import type { Metadata } from "next";

import { JemaatFormScreen } from "@/features/kejemaatan/daftar-jemaat/form";

export const metadata: Metadata = {
  title: "Tambah Jemaat",
};

export default function Page() {
  return <JemaatFormScreen />;
}
