import { notFound, redirect } from "next/navigation";

import { resolveDomain } from "@/config/resolve-domain";
import { getSession } from "@/features/auth/get-session";
import { SESSION_ENDED_PATH } from "@/lib/api/cookie";
import type { MenuNode } from "@/types/menu";

export async function loadDomain(param: string): Promise<MenuNode> {
  const session = await getSession();

  if (!session) redirect(SESSION_ENDED_PATH);

  const result = resolveDomain(session.menu, param);

  if (result.kind === "not-found") notFound();
  if (result.kind === "redirect") redirect(result.href);

  return result.domain;
}
