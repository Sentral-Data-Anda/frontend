"use client";

import { useMemo } from "react";

import { useSession } from "./session-provider";
import type { MenuAction, MenuNode } from "./types";

/** Telusuri pohon menu untuk satu slug. Diekspor supaya bisa diuji sendiri. */
export function findMenuNode(nodes: MenuNode[], slug: string): MenuNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;

    const found = findMenuNode(node.children, slug);

    if (found) return found;
  }

  return null;
}

/**
 * Hak akses peran atas satu layar.
 *
 * be-sada sudah menyintesiskan `action` per peran — peran admin menerima
 * seluruh aksi tanpa bergantung pada baris grant (lihat `menuService.findTree`).
 * Jadi tidak ada percabangan `isAdmin` di sini, dan memang tidak boleh ada:
 * dua tempat yang memutuskan hal yang sama pasti akan berbeda pendapat suatu
 * saat.
 *
 * PENTING: ini urusan TAMPILAN, bukan keamanan. Menyembunyikan tombol tidak
 * menghalangi siapa pun memanggil endpointnya. Yang menegakkan otorisasi
 * adalah `Authorization(MENU.X, "AKSI")` di setiap route be-sada.
 */
export function useMenuAccess(slug: string) {
  const session = useSession();

  return useMemo(() => {
    const actions = new Set<MenuAction>(
      findMenuNode(session.menu, slug)?.action ?? [],
    );

    return {
      isCanView: actions.has("VIEW"),
      isCanCreate: actions.has("CREATE"),
      isCanUpdate: actions.has("UPDATE"),
      isCanDelete: actions.has("DELETE"),
      isCanApprove: actions.has("APPROVE"),
      isCanReject: actions.has("REJECT"),
      isCanReset: actions.has("RESET"),
    };
  }, [session.menu, slug]);
}
