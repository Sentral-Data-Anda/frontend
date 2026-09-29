/**
 * Tiruan `/api/v1/setelan-akuntansi` (be-sada `modules/accounting_setting`).
 * Kunci, label, dan keterangan lahir dari `sync:accounting`, jadi POST dan
 * DELETE tidak ada: 404. Daftar selalu 200, tanpa paginasi.
 *
 *   MOCK_SETTING_EMPTY=1 → seluruh kunci tanpa akun
 *   MOCK_500=1           → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import type { AccountingSettingKey } from "../../../src/types/keuangan";
import { SESSION_USER_ID } from "../../mock-dashboard";
import {
  ACCOUNTING_SETTING,
  accountOf,
  isLive,
  settingView,
} from "../keuangan-store";
import { denied, json, readBody, type MockHandler } from "../kit";

const NOT_FOUND = "Setelan Akuntansi Tidak Ditemukan";

const LABEL: Record<AccountingSettingKey, string> = {
  PERSEMBAHAN_KAS: "Kas persembahan tunai",
  PERSEMBAHAN_BANK: "Bank persembahan transfer",
  PERSEMBAHAN_GATEWAY: "Kas di payment gateway",
  PENDAPATAN_EVENT: "Pendapatan pendaftaran event",
  PENYUSUTAN_BEBAN: "Beban penyusutan",
  PENYUSUTAN_AKUMULASI: "Akumulasi penyusutan",
};

const view = (row: (typeof ACCOUNTING_SETTING)[number]) => ({
  ...settingView(row),
  label: LABEL[row.key],
});

const issue = (status: number, message: string) =>
  json(
    { status, error: message, issues: [{ path: "accountId", message }] },
    status,
  );

const blank = <T extends { accountId: number | null }>(row: T) => ({
  ...row,
  accountId: null,
  updatedById: null,
});

export const setelanAkuntansiMock: MockHandler = async ({
  request,
  path,
  method,
  can,
}) => {
  if (
    path !== "/setelan-akuntansi" &&
    !path.startsWith("/setelan-akuntansi/")
  ) {
    return null;
  }

  const key = path.match(/^\/setelan-akuntansi\/([^/]+)$/)?.[1];

  if (method !== "GET" && method !== "PUT") {
    return json({ status: 404, error: NOT_FOUND }, 404);
  }

  if (!can(MENU.SETELAN_AKUNTANSI, method === "PUT" ? "UPDATE" : "VIEW")) {
    return denied();
  }

  if (path === "/setelan-akuntansi" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const rows = process.env.MOCK_SETTING_EMPTY
      ? ACCOUNTING_SETTING.map(blank)
      : ACCOUNTING_SETTING;

    return json({
      status: 200,
      message: "Berhasil Mendapatkan Semua Setelan Akuntansi",
      data: rows.map(view),
    });
  }

  if (!key || method !== "PUT") return null;

  const row = ACCOUNTING_SETTING.find((item) => item.key === key);
  if (!row) return json({ status: 404, error: NOT_FOUND }, 404);

  const body = await readBody<{ accountId?: unknown }>(request);
  const accountId =
    body.accountId === null || body.accountId === undefined
      ? null
      : Number(body.accountId);

  if (accountId !== null) {
    const account = accountOf(accountId);

    if (!account || !isLive(account)) return issue(404, "Akun Tidak Ditemukan");
    if (!account.isActive) return issue(400, "Akun Tidak Aktif");
  }

  row.accountId = accountId;
  row.updatedById = accountId === null ? null : SESSION_USER_ID;

  return json({
    status: 200,
    message: accountId
      ? "Berhasil Memperbarui Setelan Akuntansi"
      : "Berhasil Mengosongkan Setelan Akuntansi",
    data: view(row),
  });
};
