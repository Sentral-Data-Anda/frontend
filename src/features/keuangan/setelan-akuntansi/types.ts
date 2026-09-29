import type { AccountType } from "@/types/keuangan";

export type SettingAccount = {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  isActive: boolean;
};

// Kunci dan label lahir dari be-sada; layar ini tidak memegang daftarnya.
export type AccountingSetting = {
  key: string;
  label: string;
  description: string;
  account: SettingAccount | null;
  updatedBy?: { name: string } | string | number | null;
};

export type AccountingSettingPayload = {
  accountId: number | null;
};
