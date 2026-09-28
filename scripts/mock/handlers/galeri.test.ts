import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { ATTACHMENT, GALLERY, attachmentsOf } from "../kegiatan-store";
import type { MockAction } from "../kit";

import { galeriMock } from "./galeri";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SNAPSHOT = GALLERY.map((row) => ({ ...row }));
const FILES = [...ATTACHMENT];

afterEach(() => {
  GALLERY.splice(0, GALLERY.length, ...SNAPSHOT.map((row) => ({ ...row })));
  ATTACHMENT.splice(0, ATTACHMENT.length, ...FILES);
  delete process.env.MOCK_EMPTY;
});

const photo = (name: string, type = "image/jpeg", size = 10) =>
  new File([new Uint8Array(size)], name, { type });

const formOf = (fields: Record<string, string>, files: File[] = []) => {
  const body = new FormData();

  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  for (const file of files) body.append("image", file);

  return body;
};

const onCall = async (
  method: string,
  input: string,
  body?: FormData,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, { method });
  // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
  if (body) request.formData = async () => body;

  const response = (await galeriMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Json };
};

const namesOf = (body: Json) =>
  (body.data as { name: string }[]).map((row) => row.name);

describe("mock /gallery", () => {
  test("daftar terbaru dulu; filter nama dan bapelId; kosong = 404", async () => {
    const all = await onCall("GET", "/gallery");
    expect(namesOf(all.body)[0]).toBe("Latihan Paduan Suara");

    const byName = await onCall("GET", "/gallery?filter=retret");
    expect(namesOf(byName.body)).toEqual(["Retret Pemuda 2025"]);

    const byBapel = await onCall("GET", "/gallery?bapelId=4");
    expect(namesOf(byBapel.body)).toEqual(["Sekolah Minggu Juli"]);

    expect(await onCall("GET", "/gallery?filter=zzz")).toEqual({
      status: 404,
      body: { status: 404, error: "Album Tidak Ditemukan" },
    });
  });

  test("guard GALERI per aksi", async () => {
    const viewOnly = (slug: string, action: MockAction) =>
      slug === MENU.GALERI && action === "VIEW";

    expect((await onCall("GET", "/gallery", undefined, viewOnly)).status).toBe(
      200,
    );
    expect(
      (await onCall("POST", "/gallery", formOf({}), viewOnly)).status,
    ).toBe(403);
  });

  test("POST: multer dulu, lalu zod, lalu duplikat 409, lalu bapel 404", async () => {
    const five = Array.from({ length: 5 }, (_, i) => photo(`${i}.jpg`));
    expect(
      (await onCall("POST", "/gallery", formOf({}, five))).body.error,
    ).toBe("Unexpected field");
    expect(
      (
        await onCall(
          "POST",
          "/gallery",
          formOf({}, [photo("a.gif", "image/gif")]),
        )
      ).status,
    ).toBe(415);

    const invalid = await onCall("POST", "/gallery", formOf({ name: " ab " }));
    expect(invalid.status).toBe(400);
    expect(invalid.body.issues?.map((issue) => issue.path)).toEqual([
      "name",
      "bapelId",
      "listImage",
    ]);

    const duplicate = await onCall(
      "POST",
      "/gallery",
      formOf({ name: "paskah   2026", bapelId: "99" }, [photo("a.jpg")]),
    );
    expect(duplicate).toEqual({
      status: 409,
      body: { status: 409, error: "Album Sudah Tersedia" },
    });

    const noBapel = await onCall(
      "POST",
      "/gallery",
      formOf({ name: "Album Baru", bapelId: "99" }, [photo("a.jpg")]),
    );
    expect(noBapel.status).toBe(404);
    expect(noBapel.body.issues?.[0].path).toBe("bapelId");
  });

  test("POST 201: nama dirapikan, showOnWebsite berurutan, kode per bapel", async () => {
    const body = formOf(
      { name: "  Album   Baru ", bapelId: "2", isPublish: "1" },
      [photo("satu.jpg"), photo("dua.jpg")],
    );
    body.append("showOnWebsite", "0");
    body.append("showOnWebsite", "1");

    const created = await onCall("POST", "/gallery", body);
    const row = created.body.data as {
      id: number;
      code: string;
      name: string;
      isPublish: boolean;
    };

    expect(created.status).toBe(201);
    expect(row).toMatchObject({
      name: "Album Baru",
      isPublish: true,
      code: "ALBM_0002-0002",
    });
    expect(
      attachmentsOf("Gallery", row.id).map((file) => [
        file.name,
        file.showOnWebsite,
      ]),
    ).toEqual([
      ["satu", false],
      ["dua", true],
    ]);
  });

  test("PUT: tanpa image foto tetap; ganti kapitalisasi sendiri lolos; nama album lain 409", async () => {
    const before = attachmentsOf("Gallery", 2).length;

    const recased = await onCall(
      "PUT",
      "/gallery/albm_0001-0001",
      formOf({ name: "PASKAH 2026", bapelId: "1", isPublish: "0" }),
    );
    expect(recased.status).toBe(200);
    expect(attachmentsOf("Gallery", 2)).toHaveLength(before);

    const taken = await onCall(
      "PUT",
      "/gallery/ALBM_0001-0001",
      formOf({ name: "Retret Pemuda 2025", bapelId: "1" }),
    );
    expect(taken.status).toBe(409);

    const replaced = await onCall(
      "PUT",
      "/gallery/ALBM_0001-0001",
      formOf({ name: "Paskah 2026", bapelId: "1" }, [photo("baru.jpg")]),
    );
    expect(replaced.status).toBe(200);
    expect(attachmentsOf("Gallery", 2).map((file) => file.name)).toEqual([
      "baru",
    ]);
  });

  test("DELETE hapus lunak; sesudahnya 404", async () => {
    expect((await onCall("DELETE", "/gallery/ALBM_0005-0001")).status).toBe(
      200,
    );
    expect((await onCall("GET", "/gallery/ALBM_0005-0001")).status).toBe(404);
  });
});
