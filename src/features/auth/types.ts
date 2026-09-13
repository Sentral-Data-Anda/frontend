import { z } from "zod";

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

export const USER_STATUSES = ["PENDING", "ACTIVE", "DEACTIVATED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Sesi seperti yang dipakai FE.
 *
 * `GET /api/v1/auth/me` mengembalikan JAUH lebih banyak field daripada ini —
 * seluruh baris user beserta jemaat dan role jemaatnya. Yang didaftarkan di
 * sini hanya yang benar-benar dipakai; Zod membuang sisanya, sehingga tidak
 * ada field yang diam-diam terpakai tanpa pernah dideklarasikan.
 *
 * `jemaat` nullable di tipe ini walau kolomnya wajib di skema be-sada:
 * relasinya bisa saja tidak ikut ter-include pada endpoint lain yang memakai
 * tipe yang sama, dan menyalakan crash di layar sapaan karena itu tidak
 * sebanding.
 */
export const sessionSchema = z.object({
  code: z.string(),
  username: z.string(),
  status: z.enum(USER_STATUSES),
  roleUser: z.object({
    name: z.string(),
    isAdmin: z.boolean(),
  }),
  jemaat: z.object({ name: z.string() }).nullable().default(null),
  menu: z.array(menuNodeSchema),
});

export type Session = z.infer<typeof sessionSchema>;
