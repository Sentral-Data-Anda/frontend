"use client";

import { useDdlOptions } from "@/hooks/use-ddl-options";

type AccountRow = { id: number; code: string; name: string };

export const useAccountLabel = (accountId: unknown) => {
  const { rows } = useDdlOptions<AccountRow>("account");
  const found = rows.find((row) => String(row.id) === String(accountId ?? ""));

  return found ? `${found.code} — ${found.name}` : null;
};
