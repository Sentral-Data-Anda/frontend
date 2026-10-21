import type { Metadata } from "next";

import { DaftarPelayanFormScreen } from "@/features/pelayanan/daftar-pelayan/form";

export const metadata: Metadata = {
  title: "Tambah Pelayan",
};

export default function Page() {
  return <DaftarPelayanFormScreen />;
}
