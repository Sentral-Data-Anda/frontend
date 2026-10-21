import type { Metadata } from "next";

import { CutiFormScreen } from "@/features/sdm/cuti/form";

export const metadata: Metadata = {
  title: "Ajukan Cuti",
};

export default function Page() {
  return <CutiFormScreen />;
}
