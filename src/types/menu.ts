import { z } from "zod";

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
