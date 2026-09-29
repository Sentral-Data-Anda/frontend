import { z } from "zod";

import { MENU, editHref, menuHref } from "@/config/menu";
import {
  ACCOUNTING_SETTING_KEYS,
  ACCOUNTING_SETTING_LABEL,
  type AccountingSettingKey,
} from "@/types/keuangan";

import type { AccountingSetting, AccountingSettingPayload } from "./types";

export const SETELAN_AKUNTANSI_LIST_PATH = menuHref(
  MENU.KEUANGAN,
  MENU.SETELAN_AKUNTANSI,
);

export const AKUN_LIST_PATH = menuHref(MENU.KEUANGAN, MENU.AKUN);

export const settingEditHref = (key: string) =>
  editHref(MENU.KEUANGAN, MENU.SETELAN_AKUNTANSI, key);

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Setelan Akuntansi.";

export const SETTING_COUNT = ACCOUNTING_SETTING_KEYS.length;

export const settingLabelOf = (key: string) =>
  ACCOUNTING_SETTING_LABEL[key as AccountingSettingKey] ?? key;

export const accountLabelOf = (setting: AccountingSetting) =>
  setting.account ? `${setting.account.code} — ${setting.account.name}` : null;

export type SettingIssue = {
  label: string;
  variant: "warning" | "destructive";
};

export const settingIssueOf = (
  setting: AccountingSetting,
): SettingIssue | null => {
  if (!setting.account) return { label: "Belum diisi", variant: "warning" };

  if (setting.account.isActive === false) {
    return { label: "Akun nonaktif", variant: "destructive" };
  }

  return null;
};

export const filledCountOf = (settings: AccountingSetting[]) =>
  settings.filter((setting) => setting.account).length;

export const readinessSubtitle = (settings: AccountingSetting[]) =>
  `${filledCountOf(settings)} dari ${SETTING_COUNT} setelan sudah diisi`;

const BLOCKED = "Posting jurnal akan ditolak selama setelan ini belum lengkap.";

export const readinessAlertOf = (settings: AccountingSetting[]) => {
  const unset = settings.filter((setting) => !setting.account).length;
  const inactive = settings.filter(
    (setting) => setting.account?.isActive === false,
  ).length;

  if (!unset && !inactive) return null;

  if (!inactive) {
    return {
      title: `${unset} dari ${SETTING_COUNT} setelan belum diisi.`,
      message: BLOCKED,
    };
  }

  if (!unset) {
    return {
      title: `${inactive} setelan menunjuk akun nonaktif.`,
      message: BLOCKED,
    };
  }

  return {
    title: `${unset} setelan belum diisi dan ${inactive} menunjuk akun nonaktif.`,
    message: BLOCKED,
  };
};

export const updatedByLabel = (updatedBy: AccountingSetting["updatedBy"]) => {
  const name = typeof updatedBy === "object" ? updatedBy?.name : updatedBy;

  return typeof name === "string" && name && Number.isNaN(Number(name))
    ? `Terakhir diubah oleh ${name}`
    : null;
};

export const clearSettingText = (key: string) =>
  `Setelan ${settingLabelOf(key)} akan dikosongkan. Posting yang memakainya akan ditolak sampai diisi lagi.`;

export const settingFormSchema = z.object({
  accountId: z.string().min(1, "Pilih akun untuk setelan ini"),
});

export type SettingFormValues = z.infer<typeof settingFormSchema>;

export const EMPTY_SETTING_FORM: SettingFormValues = { accountId: "" };

export const toSettingForm = (
  setting: AccountingSetting,
): SettingFormValues => ({
  accountId: setting.account ? String(setting.account.id) : "",
});

export const toSettingPayload = (
  values: SettingFormValues,
): AccountingSettingPayload => ({
  accountId: values.accountId ? Number(values.accountId) : null,
});

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof SettingFormValues, string?]
> = [
  [/akun tidak ditemukan/i, "accountId", "Akun ini sudah tidak ada"],
  [/akun tidak aktif/i, "accountId"],
];

export function serverFieldError(
  message: string,
): { field: keyof SettingFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}
