import type { z } from "zod";

import { formatDate } from "@/lib/format";
import { changePasswordSchema } from "@/lib/password";

import type { OfferingItem } from "./types";

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
