import { describe, expect, test } from "bun:test";

import { ACCOUNTING_SETTING_KEYS } from "@/types/keuangan";

import {
  readinessAlertOf,
  readinessSubtitle,
  serverFieldError,
  settingIssueOf,
  toSettingPayload,
  updatedByLabel,
} from "./model";
import type { AccountingSetting } from "./types";

const setting = (
  key: AccountingSetting["key"],
  accountId: number | null,
  isActive = true,
): AccountingSetting => ({
  key,
  label: `Label ${key}`,
  description: "Keterangan",
  account: accountId
    ? {
        id: accountId,
        code: "1-100",
        name: "Kas",
        type: "ASSET",
        isActive,
      }
    : null,
});

const ALL_EMPTY = ACCOUNTING_SETTING_KEYS.map((key) => setting(key, null));

describe("kesiapan", () => {
  test("basis data baru: nol dari enam, peringatan menyebut yang diblokir", () => {
    expect(readinessSubtitle(ALL_EMPTY)).toBe("0 dari 6 setelan sudah diisi");
    expect(readinessAlertOf(ALL_EMPTY)).toEqual({
      title: "6 dari 6 setelan belum diisi.",
      message: "Posting jurnal akan ditolak selama setelan ini belum lengkap.",
    });
  });

  test("semua terisi dan aktif: tanpa peringatan", () => {
    const filled = ACCOUNTING_SETTING_KEYS.map((key) => setting(key, 2));

    expect(readinessSubtitle(filled)).toBe("6 dari 6 setelan sudah diisi");
    expect(readinessAlertOf(filled)).toBeNull();
  });

  test("akun dinonaktifkan sesudah ditunjuk tetap dihitung terisi tapi diperingatkan", () => {
    const rows = ACCOUNTING_SETTING_KEYS.map((key, index) =>
      setting(key, 2, index > 0),
    );

    expect(readinessSubtitle(rows)).toBe("6 dari 6 setelan sudah diisi");
    expect(readinessAlertOf(rows)?.title).toBe(
      "1 setelan menunjuk akun nonaktif.",
    );
  });

  test("kosong dan nonaktif bersamaan disebut keduanya", () => {
    const rows = [
      setting("PERSEMBAHAN_KAS", null),
      setting("PERSEMBAHAN_BANK", 2, false),
      setting("KAS_GATEWAY", 4),
      setting("PENDAPATAN_EVENT", 4),
      setting("PENYUSUTAN_BEBAN", 4),
      setting("PENYUSUTAN_AKUMULASI", 4),
    ];

    expect(readinessAlertOf(rows)?.title).toBe(
      "1 setelan belum diisi dan 1 menunjuk akun nonaktif.",
    );
  });
});

describe("penanda baris", () => {
  test("tanpa akun: Belum diisi", () => {
    expect(settingIssueOf(setting("PERSEMBAHAN_KAS", null))).toEqual({
      label: "Belum diisi",
      variant: "warning",
    });
  });

  test("akun nonaktif: destruktif", () => {
    expect(settingIssueOf(setting("PERSEMBAHAN_KAS", 2, false))).toEqual({
      label: "Akun nonaktif",
      variant: "destructive",
    });
  });

  test("akun aktif: tanpa penanda", () => {
    expect(settingIssueOf(setting("PERSEMBAHAN_KAS", 2))).toBeNull();
  });
});

describe("jumlah setelan mengikuti bacaan", () => {
  test("kunci yang ditambah be-sada ikut terhitung tanpa perubahan kode", () => {
    const rows = [...ALL_EMPTY, setting("KUNCI_BARU", null)];

    expect(readinessSubtitle(rows)).toBe("0 dari 7 setelan sudah diisi");
    expect(readinessAlertOf(rows)?.title).toBe("7 dari 7 setelan belum diisi.");
  });
});

describe("updatedBy", () => {
  test("id mentah tidak pernah dirender", () => {
    expect(updatedByLabel("12")).toBeNull();
    expect(updatedByLabel(12)).toBeNull();
    expect(updatedByLabel(null)).toBeNull();
    expect(updatedByLabel("")).toBeNull();
  });

  test("nama dirender, baik sebagai objek maupun teks", () => {
    expect(updatedByLabel({ name: "Maria Hutapea" })).toBe(
      "Terakhir diubah oleh Maria Hutapea",
    );
    expect(updatedByLabel("Bendahara")).toBe("Terakhir diubah oleh Bendahara");
  });
});

describe("payload dan galat", () => {
  test("kosongkan mengirim accountId null", () => {
    expect(toSettingPayload({ accountId: "" })).toEqual({ accountId: null });
    expect(toSettingPayload({ accountId: "4" })).toEqual({ accountId: 4 });
  });

  test("galat akun dipetakan ke field akun", () => {
    expect(serverFieldError("Akun Tidak Aktif")?.field).toBe("accountId");
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});
