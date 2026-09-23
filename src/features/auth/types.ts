import { z } from "zod";

import { menuNodeSchema } from "@/types/menu";

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
