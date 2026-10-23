import type { Metadata } from "next";

import { ProfileFormScreen } from "@/features/akun/profile";

export const metadata: Metadata = { title: "Ubah data pribadi" };

export default function Page() {
  return <ProfileFormScreen />;
}
