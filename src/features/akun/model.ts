import { z } from "zod";

import { FetchError } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/format";
import { changePasswordSchema } from "@/lib/password";

import type { MyProfile, OfferingItem } from "./types";

export const passwordFormSchema = changePasswordSchema;

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const EMPTY_PASSWORD_FORM: PasswordFormValues = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, keyof PasswordFormValues]> = [
  [/password lama/i, "oldPassword"],
];

export function passwordFieldError(
  message: string,
): { field: keyof PasswordFormValues; message: string } | null {
  const match = SERVER_FIELD_ERROR.find(([pattern]) => pattern.test(message));

  return match ? { field: match[1], message } : null;
}

export const verifyPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Mohon lengkapi password")
    .max(25, "Password maksimal 25 karakter"),
});

export type VerifyPasswordValues = z.infer<typeof verifyPasswordSchema>;

export const isStepUpRequired = (error: unknown): boolean =>
  error instanceof FetchError && error.code === "STEP_UP_REQUIRED";

export function summarizeOfferings(items: OfferingItem[]) {
  return {
    items,
    count: items.length,
    total: items.reduce((sum, item) => sum + Number(item.amount), 0),
  };
}

const periodFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const offeringMeta = (item: OfferingItem): string =>
  item.period
    ? `Periode ${periodFormat.format(new Date(`${item.period.slice(0, 7)}-01T00:00:00Z`))}`
    : `Diterima ${formatDate(item.receivedDate)}`;

export const roleLabels = (
  roles: { name: string; bapel: { name: string } | null }[] | undefined,
): string[] =>
  (roles ?? []).map((role) =>
    role.bapel ? `${role.name}, ${role.bapel.name}` : role.name,
  );

export const orDash = (value: string | null | undefined): string =>
  value?.trim() ? value : "—";

export const birthLabel = (
  place: string | null | undefined,
  date: string | null | undefined,
): string =>
  [place?.trim(), date ? formatDate(date) : null].filter(Boolean).join(", ") ||
  "—";

export const addressLabel = (
  profile: Pick<
    MyProfile,
    "address" | "villages" | "districts" | "regencies" | "provinces"
  >,
): string =>
  [
    profile.address?.trim(),
    profile.villages?.name,
    profile.districts?.name,
    profile.regencies?.name,
    profile.provinces?.name,
  ]
    .filter(Boolean)
    .join(", ") || "—";
