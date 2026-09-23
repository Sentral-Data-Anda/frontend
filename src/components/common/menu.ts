/**
 * Cangkang dan item menu Base UI — dipakai menu akun sidebar dan pemilih
 * tampilan dashboard. Dua konstanta, bukan komponen pembungkus: yang berulang
 * hanya kelasnya, sedangkan struktur `Menu.*` tiap pemakai berbeda (radio vs
 * item biasa, portal vs tidak).
 *
 * Sorotan item navy + teks putih (8.44:1); sorotan primary-50 di atas putih
 * hanya 1.10:1 dan praktis tak terlihat.
 */
export const MENU_POPUP =
  "bg-popover text-popover-foreground ring-border min-w-40 rounded-control p-1 shadow-md ring-1 outline-none";

export const MENU_ITEM =
  "data-highlighted:bg-primary data-highlighted:text-primary-foreground flex h-control items-center gap-2 rounded-control px-2 text-body font-medium outline-none select-none";
