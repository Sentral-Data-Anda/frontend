import type { Metadata } from "next";

import { HolidayFormScreen } from "@/features/pengaturan/hari-libur/form";

export const metadata: Metadata = {
  title: "Tambah Holiday",
};

export default function Page() {
  return <HolidayFormScreen />;
}
