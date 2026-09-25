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
  jemaat: z.object({ name: z.string() }).nullable().default(null),
  menu: z.array(menuNodeSchema),
});

export type Session = z.infer<typeof sessionSchema>;
