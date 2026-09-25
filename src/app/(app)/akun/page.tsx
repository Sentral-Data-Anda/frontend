import type { Metadata } from "next";

import { AccountScreen } from "@/features/akun/overview";

export const metadata: Metadata = { title: "Akun saya" };

export default function Page() {
  return <AccountScreen />;
}
