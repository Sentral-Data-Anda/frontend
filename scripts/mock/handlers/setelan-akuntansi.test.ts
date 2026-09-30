import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { ACCOUNTING_SETTING } from "../keuangan-store";
import type { MockAction } from "../kit";

import { setelanAkuntansiMock } from "./setelan-akuntansi";

type Json = {
  status: number;
  totalData?: number;
  totalPage?: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED = ACCOUNTING_SETTING.map((row) => ({ ...row }));

afterEach(() => {
  ACCOUNTING_SETTING.splice(
    0,
    ACCOUNTING_SETTING.length,
    ...SEED.map((row) => ({ ...row })),
  );
  delete process.env.MOCK_SETTING_EMPTY;
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await setelanAkuntansiMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

type Row = { key: string; label: string; account: { id: number } | null };

const rowsOf = (body: Json | undefined) => (body?.data ?? []) as Row[];

describe("mock /setelan-akuntansi", () => {
  test("daftar selalu 200, membawa seluruh kunci termasuk yang kosong", async () => {
    const all = await onCall("GET", "/setelan-akuntansi");

    expect(all?.status).toBe(200);
    expect(rowsOf(all?.body).length).toBe(6);
    expect(rowsOf(all?.body).filter((row) => !row.account).length).toBe(4);
    expect(rowsOf(all?.body).map((row) => row.key)).toContain(
      "PENDAPATAN_EVENT",
    );
  });

  test("setiap baris membawa label dari server", async () => {
    const all = await onCall("GET", "/setelan-akuntansi");

    expect(rowsOf(all?.body).every((row) => Boolean(row.label))).toBe(true);
    expect(rowsOf(all?.body)[0].label).toBe("Kas persembahan tunai");
  });

  test("daftar tidak berpaginasi", async () => {
    const all = await onCall("GET", "/setelan-akuntansi?page=2&limit=1");

    expect(all?.body.totalData).toBeUndefined();
    expect(all?.body.totalPage).toBeUndefined();
    expect(rowsOf(all?.body).length).toBe(6);
  });

  test("MOCK_SETTING_EMPTY mengosongkan semuanya tanpa mengubah store", async () => {
    process.env.MOCK_SETTING_EMPTY = "1";

    const all = await onCall("GET", "/setelan-akuntansi");

    expect(rowsOf(all?.body).every((row) => row.account === null)).toBe(true);
    expect(ACCOUNTING_SETTING[0].accountId).toBe(2);
  });

  test("POST dan DELETE menjawab 404, bukan 403", async () => {
    expect((await onCall("POST", "/setelan-akuntansi", {}))?.status).toBe(404);
    expect(
      (await onCall("DELETE", "/setelan-akuntansi/PERSEMBAHAN_KAS"))?.status,
    ).toBe(404);
  });

  test("guard VIEW dan UPDATE terpisah", async () => {
    const can = (slug: string, action: MockAction) =>
      slug === MENU.SETELAN_AKUNTANSI && action === "VIEW";

    expect(
      (await onCall("GET", "/setelan-akuntansi", undefined, can))?.status,
    ).toBe(200);
    expect(
      (
        await onCall(
          "PUT",
          "/setelan-akuntansi/PERSEMBAHAN_KAS",
          { accountId: 2 },
          can,
        )
      )?.status,
    ).toBe(403);
  });

  test("kunci tidak dideklarasikan menjawab 404", async () => {
    const missing = await onCall("PUT", "/setelan-akuntansi/KUNCI_ASING", {
      accountId: 2,
    });

    expect(missing?.status).toBe(404);
  });

  test("akun tidak ada 404, akun nonaktif 400, keduanya di field akun", async () => {
    const missing = await onCall("PUT", "/setelan-akuntansi/PENYUSUTAN_BEBAN", {
      accountId: 999,
    });
    expect(missing?.status).toBe(404);
    expect(missing?.body.issues?.[0].path).toBe("accountId");

    const inactive = await onCall(
      "PUT",
      "/setelan-akuntansi/PENYUSUTAN_BEBAN",
      { accountId: 25 },
    );
    expect(inactive?.status).toBe(400);
    expect(inactive?.body.error).toBe("Akun Tidak Aktif");
  });

  test("accountId null mengosongkan setelan", async () => {
    const cleared = await onCall("PUT", "/setelan-akuntansi/PERSEMBAHAN_KAS", {
      accountId: null,
    });

    expect(cleared?.status).toBe(200);
    expect((cleared?.body.data as Row).account).toBeNull();
    expect(ACCOUNTING_SETTING[0].accountId).toBeNull();
  });

  test("menunjuk akun menyimpan pilihannya", async () => {
    const saved = await onCall("PUT", "/setelan-akuntansi/PENYUSUTAN_BEBAN", {
      accountId: 24,
    });

    expect(saved?.status).toBe(200);
    expect((saved?.body.data as Row).account?.id).toBe(24);
  });
});
