import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { MockAction } from "../kit";
import { TEMPLATE_JADWAL, type TemplateJadwalRow } from "../pelayanan-store";

import { templateJadwalMock } from "./template-jadwal";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED: TemplateJadwalRow[] = structuredClone(TEMPLATE_JADWAL);

afterEach(() => {
  TEMPLATE_JADWAL.splice(0, TEMPLATE_JADWAL.length, ...structuredClone(SEED));
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
  const response = (await templateJadwalMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Json };
};

const namesOf = (body: Json) =>
  (body.data as { name: string }[]).map((row) => row.name);

const VALID = {
  bapelId: 2,
  name: "Persekutuan Doa Pemuda",
  startTime: "18:00",
  endTime: "20:00",
  detail: [
    { order: 1, rolePelayanId: 3 },
    { order: 2, rolePelayanId: 2 },
    { order: 3, rolePelayanId: 2 },
  ],
};

const MINGGU_PAGI = "TMP_JDL_0001-0001";

describe("mock /template-pelayan baca", () => {
  test("daftar urut nama, filter nama/kode dan bapelId, slot tidak berurutan", async () => {
    const all = await onCall("GET", "/template-pelayan");
    expect(all.body.message).toBe("Berhasil Mendapatkan Semua Template Jadwal");
    expect(namesOf(all.body)).toEqual(["Ibadah Minggu Pagi", "Ibadah Pemuda"]);

    const pemuda = (all.body.data as { bapel: string; detail: unknown[] }[])[1];
    expect(pemuda.bapel).toBe("Komisi Pemuda");
    expect(pemuda.detail).toEqual([
      { order: 3, roleName: "Multimedia" },
      { order: 2, roleName: "Pemusik" },
      { order: 1, roleName: "Pemandu Pujian" },
    ]);

    const byBapel = await onCall("GET", "/template-pelayan?bapelId=1");
    expect(namesOf(byBapel.body)).toEqual(["Ibadah Minggu Pagi"]);

    const byCode = await onCall("GET", "/template-pelayan?filter=jdl_0002");
    expect(namesOf(byCode.body)).toEqual(["Ibadah Pemuda"]);

    const none = await onCall("GET", "/template-pelayan?filter=zzz");
    expect(none).toEqual({
      status: 404,
      body: { status: 404, error: "Template Jadwal Tidak Ditemukan" },
    });
  });

  test("detail tanpa peka huruf besar, bapel berobjek; 404 satu pesan", async () => {
    const found = await onCall(
      "GET",
      `/template-pelayan/${MINGGU_PAGI.toLowerCase()}`,
    );
    const data = found.body.data as {
      bapel: { name: string };
      detail: { order: number }[];
    };

    expect(data.bapel.name).toBe("Majelis Jemaat");
    expect(data.detail[0].order).toBe(8);

    expect(
      (await onCall("GET", "/template-pelayan/TMP_JDL_0009-0001")).body,
    ).toEqual({ status: 404, error: "Template Jadwal Tidak Ditemukan" });
  });

  test("guard TEMPLATE_JADWAL per aksi", async () => {
    const viewOnly = (slug: string, action: MockAction) =>
      slug === MENU.TEMPLATE_JADWAL && action === "VIEW";

    expect(
      (await onCall("GET", "/template-pelayan", undefined, viewOnly)).status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/template-pelayan", VALID, viewOnly)).status,
    ).toBe(403);
    expect(
      (await onCall("GET", "/template-pelayan", undefined, () => false)).status,
    ).toBe(403);
  });
});

describe("mock /template-pelayan tulis", () => {
  test("POST 201: kode per bapel, tugas berulang, tampil di daftar", async () => {
    const created = await onCall("POST", "/template-pelayan", {
      ...VALID,
      name: "  Persekutuan   Doa Pemuda ",
    });

    expect(created.status).toBe(201);
    expect(created.body.message).toBe(
      "Berhasil Membuat Template Jadwal Pelayan",
    );
    expect(created.body.data).toMatchObject({
      code: expect.stringMatching(/^TMP_JDL_0002-\d{4}$/),
      name: "Persekutuan Doa Pemuda",
    });

    const listed = await onCall("GET", "/template-pelayan?bapelId=2");
    expect(namesOf(listed.body)).toEqual([
      "Ibadah Pemuda",
      "Persekutuan Doa Pemuda",
    ]);
  });

  test("zod dulu, dengan issues berpath", async () => {
    const rejected = await onCall("POST", "/template-pelayan", {
      bapelId: 2,
      name: "Doa",
      startTime: "20:00",
      endTime: "18:00",
      detail: [{ order: 1, rolePelayanId: 3 }, { order: 2 }],
    });

    expect(rejected.status).toBe(400);
    expect(rejected.body.issues).toEqual([
      {
        path: "name",
        message: "Nama Jadwal harus memiliki setidaknya 4 karakter",
      },
      {
        path: "endTime",
        message: "Jam Selesai harus setelah Jam Mulai Jadwal",
      },
      { path: "detail.1.rolePelayanId", message: "Role Pelayan wajib diisi" },
    ]);

    const empty = await onCall("POST", "/template-pelayan", {
      ...VALID,
      startTime: "7:00",
      detail: [],
    });
    expect(empty.body.issues).toEqual([
      {
        path: "startTime",
        message: "Format Jam Mulai harus HH:mm (contoh: 07:00)",
      },
      { path: "detail", message: "Minimal satu dalam Jadwal" },
    ]);
  });

  test("urutan galat: bapel 404 → nama 409 → role 404, semuanya berfield", async () => {
    const bapel = await onCall("POST", "/template-pelayan", {
      ...VALID,
      name: "ibadah minggu pagi",
      bapelId: 99,
    });
    expect(bapel.status).toBe(404);
    expect(bapel.body.issues).toEqual([
      { path: "bapelId", message: "Bapel Tidak Ditemukan" },
    ]);

    const taken = await onCall("POST", "/template-pelayan", {
      ...VALID,
      name: "ibadah minggu pagi",
      detail: [{ order: 1, rolePelayanId: 99 }],
    });
    expect(taken.status).toBe(409);
    expect(taken.body.error).toBe("Nama Template Sudah Tersedia");
    expect(taken.body.issues?.[0].path).toBe("name");

    const role = await onCall("POST", "/template-pelayan", {
      ...VALID,
      detail: [
        { order: 1, rolePelayanId: 3 },
        { order: 2, rolePelayanId: 99 },
      ],
    });
    expect(role.status).toBe(404);
    expect(role.body.issues).toEqual([
      {
        path: "detail.1.rolePelayanId",
        message: "Role Pelayan Tidak Ditemukan",
      },
    ]);
  });

  test("PUT: zod sebelum 404, ganti kapitalisasi sendiri boleh, slot diganti penuh", async () => {
    expect(
      (await onCall("PUT", "/template-pelayan/TMP_JDL_0009-0001", {})).status,
    ).toBe(400);
    expect(
      (await onCall("PUT", "/template-pelayan/TMP_JDL_0009-0001", VALID)).body,
    ).toEqual({ status: 404, error: "Template Jadwal Tidak Ditemukan" });

    const renamed = await onCall("PUT", `/template-pelayan/${MINGGU_PAGI}`, {
      ...VALID,
      bapelId: 1,
      name: "IBADAH MINGGU PAGI",
      detail: [
        { order: 1, rolePelayanId: 1 },
        { order: 2, rolePelayanId: 4 },
      ],
    });
    expect(renamed.status).toBe(200);
    expect(renamed.body.message).toBe(
      "Berhasil Memperbarui Template Jadwal Pelayan",
    );

    const detail = await onCall("GET", `/template-pelayan/${MINGGU_PAGI}`);
    expect((detail.body.data as { detail: unknown[] }).detail).toEqual([
      { order: 2, rolePelayanId: 4 },
      { order: 1, rolePelayanId: 1 },
    ]);

    const clash = await onCall("PUT", `/template-pelayan/${MINGGU_PAGI}`, {
      ...VALID,
      name: "ibadah pemuda",
    });
    expect(clash.status).toBe(409);
  });

  test("DELETE hapus lunak, lalu 404 dan hilang dari daftar", async () => {
    const removed = await onCall("DELETE", `/template-pelayan/${MINGGU_PAGI}`);
    expect(removed.body.message).toBe("Berhasil Menghapus Template Jadwal");
    expect(
      TEMPLATE_JADWAL.find((row) => row.id === 1)?.deletedAt,
    ).not.toBeNull();

    expect(
      (await onCall("GET", `/template-pelayan/${MINGGU_PAGI}`)).status,
    ).toBe(404);
    expect(namesOf((await onCall("GET", "/template-pelayan")).body)).toEqual([
      "Ibadah Pemuda",
    ]);
  });
});
