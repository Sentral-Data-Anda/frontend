import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { TYPE_PERSEMBAHAN } from "../keuangan-store";
import type { MockAction } from "../kit";

import { tipePersembahanMock } from "./tipe-persembahan";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED = TYPE_PERSEMBAHAN.map((row) => ({ ...row }));

afterEach(() => {
  TYPE_PERSEMBAHAN.splice(
    0,
    TYPE_PERSEMBAHAN.length,
    ...SEED.map((row) => ({ ...row })),
  );
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
  const response = await tipePersembahanMock({
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

const VALID = {
  name: "Persembahan Paskah",
  isActive: true,
  hasPeriod: false,
  requiresJemaat: false,
  accountId: 18,
};

describe("mock /type-persembahan", () => {
  test("daftar membawa akun dan disaring status", async () => {
    const all = await onCall("GET", "/type-persembahan?limit=100");

    expect(all?.status).toBe(200);
    expect((all?.body.data as { name: string }[]).length).toBe(SEED.length);

    const off = await onCall("GET", "/type-persembahan?isActive=false");
    expect(off?.status).toBe(404);
  });

  test("guard per aksi", async () => {
    const can = (slug: string, action: MockAction) =>
      slug === MENU.TIPE_PERSEMBAHAN && action === "VIEW";

    expect(
      (await onCall("GET", "/type-persembahan", undefined, can))?.status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/type-persembahan", VALID, can))?.status,
    ).toBe(403);
  });

  test("urutan galat: zod nama sebelum akun", async () => {
    const short = await onCall("POST", "/type-persembahan", {
      ...VALID,
      name: "Kas",
      accountId: 99,
    });

    expect(short?.status).toBe(400);
    expect(short?.body.issues?.[0].path).toBe("name");
  });

  test("nama ganda menjawab 409 di field nama", async () => {
    const taken = await onCall("POST", "/type-persembahan", {
      ...VALID,
      name: "  kolekte  ",
    });

    expect(taken?.status).toBe(409);
    expect(taken?.body.issues?.[0]).toEqual({
      path: "name",
      message: "Tipe Persembahan Sudah Tersedia",
    });
  });

  test("ubah nama sendiri tidak dianggap ganda", async () => {
    const same = await onCall("PUT", "/type-persembahan/TPS-0001", {
      ...VALID,
      name: "Kolekte",
      accountId: 16,
    });

    expect(same?.status).toBe(200);
  });

  test("akun tidak ada 404, nonaktif 400, bukan pendapatan 400", async () => {
    const missing = await onCall("POST", "/type-persembahan", {
      ...VALID,
      accountId: 999,
    });
    expect(missing?.status).toBe(404);
    expect(missing?.body.issues?.[0].path).toBe("accountId");

    const inactive = await onCall("POST", "/type-persembahan", {
      ...VALID,
      accountId: 25,
    });
    expect(inactive?.status).toBe(400);
    expect(inactive?.body.error).toBe("Akun Tidak Aktif");

    const wrongType = await onCall("POST", "/type-persembahan", {
      ...VALID,
      accountId: 2,
    });
    expect(wrongType?.status).toBe(400);
    expect(wrongType?.body.error).toBe("Akun Harus Bertipe Pendapatan");
  });

  test("akun boleh kosong saat simpan", async () => {
    const created = await onCall("POST", "/type-persembahan", {
      ...VALID,
      accountId: null,
    });

    expect(created?.status).toBe(201);
    expect((created?.body.data as { account: unknown }).account).toBeNull();
  });

  test("hapus ditolak bila akunnya sudah berjurnal", async () => {
    const used = await onCall("DELETE", "/type-persembahan/TPS-0001");
    expect(used?.status).toBe(400);

    const free = await onCall("DELETE", "/type-persembahan/TPS-0004");
    expect(free?.status).toBe(200);
    expect((await onCall("GET", "/type-persembahan/TPS-0004"))?.status).toBe(
      404,
    );
  });
});
