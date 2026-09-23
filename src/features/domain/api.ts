import { notFound, redirect } from "next/navigation";

import { resolveDomain } from "@/config/resolve-domain";
import { getSession } from "@/features/auth/get-session";
import type { MenuNode } from "@/types/menu";

/**
 * Simpul domain untuk satu slug rute, atau keluar lewat 404/redirect.
 *
 * Dipanggil dua kali per permintaan (metadata dan halaman); `getSession`
 * sudah di-cache per permintaan, jadi tidak ada panggilan jaringan kedua.
 */
export async function loadDomain(param: string): Promise<MenuNode> {
  const session = await getSession();

  if (!session) redirect("/login");

  const result = resolveDomain(session.menu, param);

  if (result.kind === "not-found") notFound();
  if (result.kind === "redirect") redirect(result.href);

  return result.domain;
}
