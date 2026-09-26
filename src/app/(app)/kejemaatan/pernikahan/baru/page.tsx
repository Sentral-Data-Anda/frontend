import type { Metadata } from "next";

import { MarriageFormScreen } from "@/features/kejemaatan/pernikahan/form";

export const metadata: Metadata = {
  title: "Catat Pernikahan",
};

export default function Page() {
  return <MarriageFormScreen />;
}
