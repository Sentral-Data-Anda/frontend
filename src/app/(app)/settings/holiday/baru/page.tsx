import type { Metadata } from "next";

import { HolidayFormScreen } from "@/features/pengaturan/hari-libur/form";

export const metadata: Metadata = {
  title: "Tambah Hari Libur",
};

export default function Page() {
  return <HolidayFormScreen />;
}
