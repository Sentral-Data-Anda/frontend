import type { Metadata } from "next";

import { RiwayatFormScreen } from "@/features/kejemaatan/riwayat-jemaat/form";

export const metadata: Metadata = {
  title: "Catat Riwayat Jemaat",
};

export default function Page() {
  return <RiwayatFormScreen />;
}
