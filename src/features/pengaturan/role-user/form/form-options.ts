import { type UseFormReturn } from "react-hook-form";

import { optionsOf } from "@/components/common/control";
import type { MenuAction } from "@/types/menu";

import { type RoleUserFormValues } from "../model";
import { ADMIN_LABEL } from "../types";

export type RoleUserForm = UseFormReturn<RoleUserFormValues>;

export const ADMIN_OPTIONS = optionsOf(ADMIN_LABEL);

export const NOT_HELD_HINT = "Anda tidak memegang izin ini";

export type OnPickAction = (
  slug: string,
  action: MenuAction,
  isOn: boolean,
) => void;

export type OnPickRow = (slug: string, pickable: MenuAction[]) => void;
