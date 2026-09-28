import { type UseFormReturn } from "react-hook-form";

import { useDdlOptions } from "@/hooks/use-ddl-options";

import { type AnnouncementFormValues } from "../model";
import type { AnnouncementBapel } from "../types";

export type AnnouncementForm = UseFormReturn<AnnouncementFormValues>;

export const PUBLISH_OPTIONS = [
  { value: "false", label: "Draf" },
  { value: "true", label: "Terbitkan" },
];

export const PIN_OPTIONS = [
  { value: "false", label: "Biasa" },
  { value: "true", label: "Sematkan di atas" },
];

export function useBapelOptions(
  selected: string,
  saved: AnnouncementBapel | null,
) {
  const bapel = useDdlOptions("bapel", "id", selected);
  const isSavedMissing =
    saved !== null &&
    !bapel.options.some((option) => option.value === String(saved.id));
  const options = isSavedMissing
    ? [...bapel.options, { value: String(saved.id), label: saved.name }]
    : bapel.options;

  return {
    options: options.length
      ? [{ value: "", label: "Seluruh jemaat" }, ...options]
      : options,
    isLoading: bapel.isLoading,
  };
}
