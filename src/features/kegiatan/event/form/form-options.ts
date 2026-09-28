import type { UseFormReturn } from "react-hook-form";

import type { EventFormValues } from "../model";

export type EventForm = UseFormReturn<EventFormValues>;

export const PLACE_OPTIONS = [
  { value: "1", label: "Di gereja" },
  { value: "0", label: "Di luar gereja" },
];

export const PAID_OPTIONS = [
  { value: "0", label: "Gratis" },
  { value: "1", label: "Berbayar" },
];

export const PUBLISH_OPTIONS = [
  { value: "0", label: "Draf" },
  { value: "1", label: "Terbit" },
];
