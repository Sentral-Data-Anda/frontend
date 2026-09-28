import { type UseFormReturn } from "react-hook-form";

import { type AnnouncementFormValues } from "../model";

export type AnnouncementForm = UseFormReturn<AnnouncementFormValues>;

export const PUBLISH_OPTIONS = [
  { value: "false", label: "Draf" },
  { value: "true", label: "Terbitkan" },
];

export const PIN_OPTIONS = [
  { value: "false", label: "Biasa" },
  { value: "true", label: "Sematkan di atas" },
];
