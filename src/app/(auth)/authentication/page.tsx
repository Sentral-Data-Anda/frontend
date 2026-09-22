import { setTimeout as delay } from "node:timers/promises";

import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/get-session";
import { isSafeRedirectPath } from "@/lib/redirect";

import { FirstLoginForm } from "./first-login-form";

export const metadata = { title: "Menyiapkan" };

/**
 * Jeda minimum supaya animasi huruf sempat terbaca: 150ms jeda tampil
 * `LoadingPage` + 800ms gerakannya = 950ms, dibulatkan ke 1 detik. Itu juga
 * batas atas yang disepakati untuk waktu tambahan yang dirasakan user.
 *
 * Dipasang pada kerja SERVER, bukan di client, dan itu bukan pilihan gaya:
 * `loading.tsx` dicabut Next begitu kerja server segmen ini selesai, terlepas
 * dari apa pun yang dilakukan client sesudahnya. Menahan kerja servernya
 * adalah satu-satunya cara membuat layar tunggunya bertahan.
 *
 * Hanya berlaku di layar ini. Menambahkannya ke navigasi lain berarti
 * memperlambat aplikasi demi animasi.
 */
const MINIMUM_HOLD_MS = 1_000;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [session, params] = await Promise.all([
    getSession(),
    searchParams,
    delay(MINIMUM_HOLD_MS),
  ]);

  // Cookie tidak ada, sudah kedaluwarsa, atau ditolak be-sada.
  if (!session) redirect("/login");

  // Akun yang dinonaktifkan sementara masih memegang cookie yang sah sampai
  // masa berlakunya habis. Tanpa cabang ini ia lolos ke app shell dan baru
  // ditolak satu per satu oleh setiap panggilan API di dalamnya.
  if (session.status === "DEACTIVATED") redirect("/login");

  if (session.status === "PENDING")
    return <FirstLoginForm code={session.code} />;

  redirect(isSafeRedirectPath(params.redirect) ? params.redirect : "/");
}
