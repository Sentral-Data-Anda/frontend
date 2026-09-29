import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { ACCOUNT } from "../keuangan-store";
import type { MockAction } from "../kit";

import { akunMock } from "./akun";

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED = ACCOUNT.map((row) => ({ ...row }));

afterEach(() => {
  ACCOUNT.splice(0, ACCOUNT.length, ...SEED.map((row) => ({ ...row })));
  delete process.env.MOCK_NO_ACCOUNTS;
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
  const response = await akunMock({
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

const codesOf = (body: Json | undefined) =>
  (body?.data as { code: string }[]).map((row) => row.code);

const VALID = {
  code: "1-999",
  name: "Kas Baru",
  type: "ASSET",
  parentAccountId: 1,
  isActive: true,
};

describe("mock /account", () => {
  test("daftar urut kode, akun terhapus tidak ikut", async () => {
    const all = await onCall("GET", "/account?limit=100");

    expect(codesOf(all?.body)[0]).toBe("1");
    expect(codesOf(all?.body)).not.toContain("5-910");
  });

  test("saring tipe, status aktif, dan induk", async () => {
    const income = await onCall("GET", "/account?type=INCOME&limit=100");
    expect(codesOf(income?.body).every((code) => code.startsWith("4"))).toBe(
      true,
    );

    const inactive = await onCall("GET", "/account?isActive=false&limit=100");
    expect(codesOf(inactive?.body)).toEqual(["5-900"]);

    // `1`/`0` dan huruf besar sama sahnya; tak terbaca = tidak menyaring.
    expect(
      codesOf((await onCall("GET", "/account?isActive=0&limit=100"))?.body),
    ).toEqual(["5-900"]);
    expect(
      codesOf((await onCall("GET", "/account?isActive=TRUE&limit=100"))?.body),
    ).not.toContain("5-900");
    expect(
      codesOf((await onCall("GET", "/account?isActive=yes&limit=100"))?.body),
    ).toContain("5-900");

    const children = await onCall("GET", "/account?parentAccountId=13");
    expect(codesOf(children?.body)).toEqual(["3-100"]);
  });

  test("MOCK_NO_ACCOUNTS menjawab 404: instalasi baru", async () => {
    process.env.MOCK_NO_ACCOUNTS = "1";
    const all = await onCall("GET", "/account");

    expect(all?.status).toBe(404);
    expect(all?.body.error).toBe("Akun Tidak Ditemukan");
  });

  test("izin per aksi", async () => {
    const can = (slug: string, action: MockAction) =>
      slug === MENU.AKUN && action === "VIEW";

    expect((await onCall("GET", "/account", undefined, can))?.status).toBe(200);
    expect((await onCall("POST", "/account", VALID, can))?.status).toBe(403);
  });

  test("urutan galat: zod, kode ganda, induk, kedalaman", async () => {
    expect(
      (await onCall("POST", "/account", { ...VALID, code: "1 999" }))?.body
        .issues?.[0]?.path,
    ).toBe("code");

    expect(
      (await onCall("POST", "/account", { ...VALID, name: "" }))?.body
        .issues?.[0]?.path,
    ).toBe("name");

    const taken = await onCall("POST", "/account", { ...VALID, code: "1-100" });
    expect(taken?.status).toBe(409);
    expect(taken?.body.issues?.[0]?.path).toBe("code");

    const missing = await onCall("POST", "/account", {
      ...VALID,
      parentAccountId: 999,
    });
    expect(missing?.status).toBe(404);
    expect(missing?.body.issues?.[0]?.path).toBe("parentAccountId");

    const wrongType = await onCall("POST", "/account", {
      ...VALID,
      type: "EXPENSE",
    });
    expect(wrongType?.body.error).toBe("Akun Induk Harus Bertipe Sama");
  });

  test("induk = diri sendiri dan siklus adalah dua galat berbeda", async () => {
    const self = await onCall("PUT", "/account/1", {
      code: "1",
      name: "Aset",
      type: "ASSET",
      parentAccountId: 1,
      isActive: true,
    });
    expect(self?.body.error).toBe("Akun Induk Tidak Boleh Akun Itu Sendiri");

    const cycle = await onCall("PUT", "/account/1", {
      code: "1",
      name: "Aset",
      type: "ASSET",
      parentAccountId: 2,
      isActive: true,
    });
    expect(cycle?.body.error).toBe("Akun Induk Tidak Boleh Membentuk Siklus");
  });

  test("bacaan membawa induk lengkap; detail menambah hasJournalLines", async () => {
    const detail = await onCall("GET", "/account/1-100");
    const data = detail?.body.data as {
      parent: { id: number; code: string; name: string; type: string };
      hasJournalLines: boolean;
    };

    expect(data.parent).toEqual({
      id: 1,
      code: "1",
      name: "Aset",
      type: "ASSET",
    });
    expect(data.hasJournalLines).toBe(true);
  });

  test("tipe tidak bisa diubah bila akun sudah punya baris jurnal", async () => {
    const refused = await onCall("PUT", "/account/1-100", {
      code: "1-100",
      name: "Kas",
      type: "EXPENSE",
      parentAccountId: null,
      isActive: true,
    });

    expect(refused?.status).toBe(400);
    expect(refused?.body.code).toBe("ACCOUNT_TYPE_LOCKED");
    expect(refused?.body.issues?.[0]?.path).toBe("type");
  });

  test("hapus: turunan dan dipakai adalah kode berbeda; sisanya soft delete", async () => {
    const hasChildren = await onCall("DELETE", "/account/1");
    expect(hasChildren?.status).toBe(400);
    expect(hasChildren?.body.code).toBe("ACCOUNT_HAS_CHILDREN");
    expect(hasChildren?.body.issues).toBeUndefined();

    const inUse = await onCall("DELETE", "/account/1-100");
    expect(inUse?.status).toBe(400);
    expect(inUse?.body.code).toBe("ACCOUNT_IN_USE");
    expect(inUse?.body.error).toContain("Nonaktifkan Saja");

    const removed = await onCall("DELETE", "/account/1-110");
    expect(removed?.status).toBe(200);
    expect((await onCall("GET", "/account/1-110"))?.status).toBe(404);
  });

  test("pesan hapus menyebut setiap sumber yang menghalangi", async () => {
    // Akun 2 = Kas: baris jurnal DAN kunci setelan PERSEMBAHAN_KAS.
    const refused = await onCall("DELETE", "/account/1-100");

    expect(refused?.body.error).toBe(
      "Akun Tidak Dapat Dihapus Karena Sudah Dipakai Baris Jurnal, Setelan Akuntansi. Nonaktifkan Saja",
    );
  });

  test("buat lalu baca kembali dengan kode huruf besar", async () => {
    const created = await onCall("POST", "/account", {
      ...VALID,
      code: "1-999",
    });

    expect(created?.status).toBe(201);
    expect((created?.body.data as { code: string }).code).toBe("1-999");
    expect((await onCall("GET", "/account/1-999"))?.status).toBe(200);
  });
});
