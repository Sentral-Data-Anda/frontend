import type { Metadata } from "next";

import { TipeBarangFormScreen } from "@/features/inventaris/tipe-barang/form";

export const metadata: Metadata = {
  title: "Tambah Tipe Barang",
};

export default function Page() {
  return <TipeBarangFormScreen />;
}
