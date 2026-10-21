import type { Metadata } from "next";

import { WilayahFormScreen } from "@/features/kejemaatan/wilayah/form";

export const metadata: Metadata = {
  title: "Tambah Wilayah",
};

export default function Page() {
  return <WilayahFormScreen />;
}
