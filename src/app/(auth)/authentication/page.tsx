import { setTimeout as delay } from "node:timers/promises";

import { redirect } from "next/navigation";

import { AuthCard } from "@/components/common/brand";
import { getSession } from "@/features/auth/get-session";
import { AuthHandoffDone, FirstLoginForm } from "@/features/auth/ui";
import { isSafeRedirectPath } from "@/lib/redirect";

export const metadata = { title: "Menyiapkan" };

// Keputusan user: animasi layar tunggu tampil utuh (150ms jeda + 800ms gerak).
// Ditahan di server karena Next mencabut loading.tsx begitu kerja server selesai.
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

  if (!session) redirect("/login");

  if (session.status === "DEACTIVATED") redirect("/login");

  if (session.status === "PENDING")
    return (
      <AuthCard>
        <FirstLoginForm code={session.code} />
        <AuthHandoffDone />
      </AuthCard>
    );

  redirect(isSafeRedirectPath(params.redirect) ? params.redirect : "/");
}
