import { z } from "zod";

/**
 * Pohon menu peran: kontrak be-sada yang dipakai LINTAS lapisan — sidebar dan
 * bottom tab (`components/layout`), pemetaan href (`config/menu.ts`),
 * penjaga halaman domain, dan tiap fitur yang mengecek izin. Karena itu ia
 * tinggal di `types/`, bukan di dalam `features/auth`: tipe yang dipakai
 * semua orang bukan milik satu fitur (docs/design/frontend-structure.md §7).
 */

/**
 * Aksi yang bisa dipegang sebuah peran atas satu menu.
 *
 * Cerminan `enum MenuAction` di `be-sada/src/config/schema.prisma:409`. RESET
 * bukan sinonim UPDATE: ia menerbitkan ulang kredensial sekaligus mencabut
 * sesi.
 */
export const MENU_ACTIONS = [
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESET",
  "APPROVE",
  "REJECT",
] as const;

export type MenuAction = (typeof MENU_ACTIONS)[number];

export type MenuNode = {
  publicId: string;
  slug: string;
  name: string;
  order: number;
  action: MenuAction[];
  children: MenuNode[];
};

/**
 * Schema divalidasi di batas jaringan, bukan diasumsikan.
 *
 * `z.lazy` dipakai karena simpul menu bersarang ke dirinya sendiri; tanpa itu
 * referensinya dipakai sebelum terdefinisi.
 */
export const menuNodeSchema: z.ZodType<MenuNode> = z.lazy(() =>
  z.object({
    publicId: z.string(),
    slug: z.string(),
    name: z.string(),
    order: z.number(),
    action: z.array(z.enum(MENU_ACTIONS)),
    children: z.array(menuNodeSchema),
  }),
);
