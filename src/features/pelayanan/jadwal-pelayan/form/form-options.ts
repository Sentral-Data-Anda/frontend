import { type UseFormReturn } from "react-hook-form";

import type { SelectOption } from "@/components/common/control";

import type { PelayanRows } from "../api";
import {
  toPelayanOptions,
  withSavedPelayan,
  type JadwalFormValues,
} from "../model";
import type { SlotPelayan } from "../types";

export type JadwalForm = UseFormReturn<JadwalFormValues>;

export const SLOT_PREFIX = "slot";

export const SLOTS_ADD_ID = "slots-add";

export const MAKE_TEMPLATE_OPTIONS: SelectOption[] = [
  { value: "false", label: "Tidak" },
  { value: "true", label: "Ya" },
];

const NO_TAKEN: ReadonlyMap<string, number> = new Map();

export type SlotOptions = {
  isReady: boolean;
  byRole: ReadonlyMap<string, PelayanRows>;
  saved: ReadonlyMap<string, SlotPelayan>;
};

export const pelayanOptionsOf = (
  slotOptions: SlotOptions,
  roleId: string,
  value: string,
  takenKeys: ReadonlyMap<string, number> = NO_TAKEN,
): SelectOption[] =>
  withSavedPelayan(
    toPelayanOptions(slotOptions.byRole.get(roleId)?.rows ?? [], takenKeys),
    value,
    slotOptions.saved.get(value),
  );

export const pelayanLabelOf = (
  slotOptions: SlotOptions,
  roleId: string,
  value: string,
) =>
  value
    ? (pelayanOptionsOf(slotOptions, roleId, value).find(
        (option) => option.value === value,
      )?.label ?? "")
    : "";
