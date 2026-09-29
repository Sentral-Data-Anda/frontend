import type { AccountType, AccountingSettingKey } from "@/types/keuangan";

export type SettingAccount = {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  isActive?: boolean;
};

export type AccountingSetting = {
  key: AccountingSettingKey;
  description: string;
  account: SettingAccount | null;
  updatedBy?: { name: string } | string | number | null;
};

export type AccountingSettingPayload = {
  accountId: number | null;
};
