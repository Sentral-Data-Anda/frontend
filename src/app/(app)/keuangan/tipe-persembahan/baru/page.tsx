import type { Metadata } from "next";

import { OfferingTypeFormScreen } from "@/features/keuangan/tipe-persembahan/form";

export const metadata: Metadata = {
  title: "Tambah Tipe Persembahan",
};

export default function Page() {
  return <OfferingTypeFormScreen />;
}
