import { afterAll, describe, expect, test } from "bun:test";

import type { MockAction } from "../kit";
import { ROLE_PELAYAN } from "../pelayanan-store";

import { rolePelayanMock } from "./role-pelayan";

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
  const response = (await rolePelayanMock({
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

const SNAPSHOT = structuredClone(ROLE_PELAYAN);

afterAll(() => {
  ROLE_PELAYAN.splice(0, ROLE_PELAYAN.length, ...SNAPSHOT);
});

const namesOf = (body: Json) =>
  (body.data as { name: string }[]).map((row) => row.name);

const LOCKED =
  "Role Pemusik Dipakai Sistem dan Tidak Dapat Diubah atau Dihapus";

describe("mock /role-pelayan", () => {
  test("daftar urut nama, cari nama, kosong = 404", async () => {
    expect(namesOf((await onCall("GET", "/role-pelayan")).body)).toEqual([
      "Kolektan",
      "Liturgis",
      "Multimedia",
      "Pemandu Pujian",
      "Pemusik",
      "Penerima Tamu",
      "Singer",
    ]);
    expect(
      namesOf((await onCall("GET", "/role-pelayan?filter=PEM")).body),
    ).toEqual(["Pemandu Pujian", "Pemusik"]);
    expect(await onCall("GET", "/role-pelayan?filter=zzz")).toEqual({
      status: 404,
      body: { status: 404, error: "Role Pelayan Tidak Ditemukan" },
    });
  });

  test("validasi sebelum mencari id", async () => {
    const blank = await onCall("PUT", "/role-pelayan/999", { name: "  " });
    expect(blank.body.error).toBe(
      "Nama Role Pelayan harus memiliki setidaknya 2 karakter",
    );
    expect((await onCall("POST", "/role-pelayan", {})).body.error).toBe(
      "Mohon Lengkapi Nama Role Pelayan",
    );
    expect(
      (await onCall("PUT", "/role-pelayan/999", { name: "Doa" })).status,
    ).toBe(404);
  });

  test("duplikat 409 dengan issue name; ganti kapitalisasi sendiri lolos", async () => {
    expect(await onCall("POST", "/role-pelayan", { name: "liturgis" })).toEqual(
      {
        status: 409,
        body: {
          status: 409,
          error: "Role Pelayan Sudah Tersedia",
          issues: [{ path: "name", message: "Role Pelayan Sudah Tersedia" }],
        },
      },
    );
    expect(
      (await onCall("PUT", "/role-pelayan/1", { name: "LITURGIS" })).status,
    ).toBe(200);
    expect(
      (await onCall("PUT", "/role-pelayan/1", { name: "Singer" })).status,
    ).toBe(409);
  });

  test("Pemusik terkunci untuk PUT dan DELETE", async () => {
    expect(
      await onCall("PUT", "/role-pelayan/2", { name: "Pemain Musik" }),
    ).toEqual({ status: 400, body: { status: 400, error: LOCKED } });
    expect(await onCall("DELETE", "/role-pelayan/2")).toEqual({
      status: 400,
      body: { status: 400, error: LOCKED },
    });
  });

  test("hapus dipakai 400 menyebut pemakainya; role baru terhapus lunak", async () => {
    expect((await onCall("DELETE", "/role-pelayan/1")).body.error).toBe(
      "Role Pelayan Tidak Dapat Dihapus Karena Masih Digunakan oleh Pelayan",
    );

    const created = await onCall("POST", "/role-pelayan", { name: "Doa" });
    expect(created.status).toBe(201);
    expect(created.body.data).toEqual({
      id: 8,
      publicId: "role-pelayan-8",
      name: "Doa",
    });

    expect((await onCall("DELETE", "/role-pelayan/8")).status).toBe(200);
    expect(ROLE_PELAYAN.find((row) => row.id === 8)?.deletedAt).not.toBeNull();
    expect((await onCall("GET", "/role-pelayan/8")).status).toBe(404);
  });

  test("guard ROLE_PELAYAN per aksi", async () => {
    const onlyView = (_slug: string, action: MockAction) => action === "VIEW";

    expect(
      (await onCall("GET", "/role-pelayan", undefined, onlyView)).status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/role-pelayan", { name: "Doa" }, onlyView)).status,
    ).toBe(403);
  });
});
