import { afterAll, describe, expect, test } from "bun:test";

import type { MockAction } from "../kit";
import { MUSIK_SKILL } from "../pelayanan-store";

import { skillMusikMock } from "./skill-musik";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

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
  const response = (await skillMusikMock({
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

const SNAPSHOT = structuredClone(MUSIK_SKILL);

afterAll(() => {
  MUSIK_SKILL.splice(0, MUSIK_SKILL.length, ...SNAPSHOT);
});

const namesOf = (body: Json) =>
  (body.data as { name: string }[]).map((row) => row.name);

describe("mock /musik-skill", () => {
  test("daftar urut nama, cari nama, kosong = 404", async () => {
    expect(namesOf((await onCall("GET", "/musik-skill")).body)).toEqual([
      "Bass",
      "Biola",
      "Drum",
      "Gitar",
      "Keyboard",
    ]);
    expect(
      namesOf((await onCall("GET", "/musik-skill?filter=GI")).body),
    ).toEqual(["Gitar"]);
    expect(await onCall("GET", "/musik-skill?filter=zzz")).toEqual({
      status: 404,
      body: { status: 404, error: "Skill Musik Tidak Ditemukan" },
    });
  });

  test("validasi sebelum mencari id; nama dinormalisasi sebelum panjang", async () => {
    const blank = await onCall("PUT", "/musik-skill/999", { name: "   " });
    expect(blank.status).toBe(400);
    expect(blank.body.error).toBe(
      "Nama Skill Musik harus memiliki setidaknya 2 karakter",
    );
    expect((await onCall("POST", "/musik-skill", {})).body.error).toBe(
      "Mohon Lengkapi Nama Skill Musik",
    );
    expect(
      (await onCall("POST", "/musik-skill", { name: "x".repeat(51) })).body
        .error,
    ).toBe("Nama Skill Musik tidak boleh lebih dari 50 karakter");
    expect(
      (await onCall("PUT", "/musik-skill/999", { name: "Seruling" })).status,
    ).toBe(404);
  });

  test("duplikat 409 tanpa peka huruf besar; ganti kapitalisasi sendiri lolos", async () => {
    expect(await onCall("POST", "/musik-skill", { name: " gitar " })).toEqual({
      status: 409,
      body: {
        status: 409,
        error: "Skill Musik Sudah Tersedia",
        issues: [{ path: "name", message: "Skill Musik Sudah Tersedia" }],
      },
    });
    expect(
      (await onCall("PUT", "/musik-skill/4", { name: "DRUM" })).status,
    ).toBe(200);
    expect(
      (await onCall("PUT", "/musik-skill/4", { name: "Bass" })).status,
    ).toBe(409);
  });

  test("hapus dipakai 400; Biola dan skill baru terhapus lunak", async () => {
    expect((await onCall("DELETE", "/musik-skill/2")).body.error).toBe(
      "Skill Musik Tidak Dapat Dihapus Karena Masih Digunakan oleh Pelayan",
    );

    expect((await onCall("DELETE", "/musik-skill/5")).status).toBe(200);
    expect(MUSIK_SKILL.find((row) => row.id === 5)?.deletedAt).not.toBeNull();
    expect((await onCall("GET", "/musik-skill/5")).status).toBe(404);

    const created = await onCall("POST", "/musik-skill", { name: "biola" });
    expect(created.status).toBe(201);
    expect(created.body.data).toEqual({
      id: 6,
      publicId: "musik-skill-6",
      name: "biola",
    });
    expect((await onCall("DELETE", "/musik-skill/6")).status).toBe(200);
  });

  test("guard SKILL_MUSIK per aksi", async () => {
    const onlyView = (_slug: string, action: MockAction) => action === "VIEW";

    expect(
      (await onCall("GET", "/musik-skill", undefined, onlyView)).status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/musik-skill", { name: "Cello" }, onlyView))
        .status,
    ).toBe(403);
    expect(
      (await onCall("DELETE", "/musik-skill/5", undefined, onlyView)).status,
    ).toBe(403);
  });
});
