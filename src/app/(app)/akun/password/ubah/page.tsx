import type { Metadata } from "next";

import { PasswordFormScreen } from "@/features/akun/password";

export const metadata: Metadata = { title: "Ubah password" };

export default function Page() {
  return <PasswordFormScreen />;
}
