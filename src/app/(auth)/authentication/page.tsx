import { setTimeout as delay } from "node:timers/promises";

import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/get-session";
import { FirstLoginForm } from "@/features/auth/ui";
import { isSafeRedirectPath } from "@/lib/redirect";

export const metadata = { title: "Menyiapkan" };

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
    return <FirstLoginForm code={session.code} />;

  redirect(isSafeRedirectPath(params.redirect) ? params.redirect : "/");
}
