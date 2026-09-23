"use client";

import { useMemo } from "react";

import type { MenuSlug } from "@/config/menu";
import { findMenuNode } from "@/lib/menu-tree";
import type { MenuAction } from "@/types/menu";

import { useSession } from "./session-provider";

/**
 * Hak akses peran atas satu layar.
 *
 * be-sada sudah menyintesiskan `action` per peran — peran admin menerima
 * seluruh aksi tanpa bergantung pada baris grant (lihat `menuService.findTree`).
 * Jadi tidak ada percabangan `isAdmin` di sini, dan memang tidak boleh ada:
 * dua tempat yang memutuskan hal yang sama pasti akan berbeda pendapat suatu
 * saat.
 *
 * `slug` bertipe `MenuSlug`, bukan `string`: `useMenuAccess("DAFTAR_JEMAT")`
 * yang salah ketik tidak melempar apa pun — ia mengembalikan seluruh aksi
 * bernilai false dan menyembunyikan tombol yang seharusnya ada, kegagalan yang
 * tidak meninggalkan jejak apa pun untuk ditelusuri. `findMenuNode`
 * tetap menerima `string`, karena ia penelusur pohon umum yang juga dipakai
 * `bottom-tab.tsx` untuk slug yang datang dari data.
 *
 * PENTING: ini urusan TAMPILAN, bukan keamanan. Menyembunyikan tombol tidak
 * menghalangi siapa pun memanggil endpointnya. Yang menegakkan otorisasi
 * adalah `Authorization(MENU.X, "AKSI")` di setiap route be-sada.
 */
export function useMenuAccess(slug: MenuSlug) {
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
