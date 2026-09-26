import { z } from "zod";

import { menuNodeSchema } from "@/types/menu";

export const USER_STATUSES = ["PENDING", "ACTIVE", "DEACTIVATED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const sessionSchema = z.object({
  code: z.string(),
  username: z.string(),
  status: z.enum(USER_STATUSES),
  roleUser: z.object({
    name: z.string(),
    isAdmin: z.boolean(),
  }),
  jemaat: z
    .object({
      name: z.string(),
      code: z.string().optional(),
      gender: z.enum(["L", "P"]).optional(),
      birthPlace: z.string().nullish(),
      birthDate: z.string().nullish(),
      phone: z.string().nullish(),
      email: z.string().nullish(),
      statusMarital: z.enum(["SM", "BM", "CM", "CH"]).nullish(),
      address: z.string().nullish(),
      typeJemaat: z.enum(["ANGGOTA", "SIMPATISAN"]).optional(),
      statusJemaat: z.enum(["AKTIF", "TIDAK_AKTIF"]).optional(),
      joinedAt: z.string().nullish(),
      roleJemaat: z
        .array(
          z.object({
            name: z.string(),
            bapel: z.object({ name: z.string() }).nullable(),
          }),
        )
        .optional(),
    })
    .nullable()
    .default(null),
  menu: z.array(menuNodeSchema),
});

export type Session = z.infer<typeof sessionSchema>;
