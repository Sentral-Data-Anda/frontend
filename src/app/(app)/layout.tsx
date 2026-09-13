import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/features/auth/get-session";
import { SessionProvider } from "@/features/auth/session-provider";

/**
 * Satu-satunya tempat sesi diambil untuk seluruh aplikasi.
 *
 * `proxy.ts` sudah menendang permintaan tanpa cookie sebelum sampai ke sini,
 * jadi pemeriksaan di bawah adalah lapis kedua — dan lapis kedua itu perlu:
 * cookie bisa saja ada tapi ditolak be-sada (sesi dicabut, akun dihapus), dan
 * proxy tidak pernah tahu itu karena ia tidak memverifikasi apa pun.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");

  // PENDING dan DEACTIVATED tidak punya urusan di app shell; keduanya diurus
  // `/authentication`.
  if (session.status !== "ACTIVE") redirect("/authentication");

  return (
    <SessionProvider session={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
