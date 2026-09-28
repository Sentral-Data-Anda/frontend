import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import {
  ANNOUNCEMENT,
  ATTACHMENT,
  announcementFeed,
  publicAnnouncements,
  TODAY,
} from "../kegiatan-store";
import type { MockAction } from "../kit";

import { pengumumanMock } from "./pengumuman";

type Row = {
  code: string;
  title: string;
  isPinned: boolean;
  status: string;
  category: string;
  expiryDate: string | null;
  listImage: { publicId: string; name: string; showOnWebsite: boolean }[];
};

const snapshot = {
  rows: ANNOUNCEMENT.map((row) => ({ ...row })),
  files: ATTACHMENT.map((row) => ({ ...row })),
};

beforeEach(() => {
  ANNOUNCEMENT.splice(
    0,
    ANNOUNCEMENT.length,
    ...snapshot.rows.map((row) => ({ ...row })),
  );
  ATTACHMENT.splice(
    0,
    ATTACHMENT.length,
    ...snapshot.files.map((row) => ({ ...row })),
  );
});

afterEach(() => {
  delete process.env.MOCK_EMPTY;
  ANNOUNCEMENT.splice(0, ANNOUNCEMENT.length, ...snapshot.rows);
  ATTACHMENT.splice(0, ATTACHMENT.length, ...snapshot.files);
});

const call = async (
  path: string,
  init: { method?: string; body?: FormData } = {},
  grants: MockAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"],
) => {
  const url = new URL(path, "http://mock.test");
  const method = init.method ?? "GET";
  const { body } = init;
  // FormData happy-dom tidak dikenali Request asli Bun.
  const request = body
    ? ({ formData: async () => body } as unknown as Request)
    : new Request(url);
  const response = await pengumumanMock({
    request,
    url,
    path: url.pathname,
    method,
    can: (slug: MenuSlug, action) =>
      slug === MENU.PENGUMUMAN && grants.includes(action),
    isAdmin: false,
    sessionCode: "test",
  });

  return { status: response!.status, body: await response!.json() };
};

const formOf = (
  fields: Record<string, string>,
  files: [File, string][] = [],
) => {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  for (const [file, flag] of files) {
    form.append("image", file);
    form.append("showOnWebsite", flag);
  }

  return form;
};

const VALID = {
  title: "Pendaftaran katekisasi",
  content: "Baris satu\nBaris dua",
  category: "PENGUMUMAN",
  publishDate: TODAY,
  isPublished: "1",
  isPinned: "0",
};

const png = (name: string) => new File(["x"], name, { type: "image/png" });

describe("GET /pengumuman", () => {
  test("disematkan dulu, lalu tanggal terbit terbaru; empat status ada", async () => {
    const { body } = await call("/pengumuman?limit=100");
    const rows = body.data as Row[];

    expect(body.message).toBe("Berhasil Mendapatkan Semua Pengumuman");
    expect(rows[0]).toMatchObject({
      title: "Warta Jemaat Minggu Ini",
      isPinned: true,
    });
    expect(new Set(rows.map((row) => row.status))).toEqual(
      new Set(["TERBIT", "TERJADWAL", "DRAF", "KEDALUWARSA"]),
    );
  });

  test("filter judul, kategori, status, badan pelayanan; nilai tak dikenal diabaikan", async () => {
    const titles = async (query: string) =>
      ((await call(`/pengumuman?limit=100&${query}`)).body.data as Row[]).map(
        (row) => row.title,
      );

    expect(await titles("filter=RETRET")).toEqual(["Retret Pemuda 2026"]);
    expect(await titles("category=BERITA_DUKA")).toEqual([
      "Berita duka: Bpk. Gideon Tampubolon",
    ]);
    expect(await titles("status=TERJADWAL")).toEqual([
      "Jadwal ibadah Natal 2026",
    ]);
    expect(await titles("bapelId=2")).toEqual(["Rapat pengurus Komisi Pemuda"]);
    expect(await titles("category=XYZ&status=ABC")).toHaveLength(9);
  });

  test("kosong = 404; tanpa VIEW = 403", async () => {
    expect((await call("/pengumuman?filter=zzz")).body).toEqual({
      status: 404,
      error: "Pengumuman Tidak Ditemukan",
    });
    expect((await call("/pengumuman", {}, [])).status).toBe(403);
  });
});

describe("POST /pengumuman", () => {
  test("201 multipart; lampiran berurutan dengan bendera website", async () => {
    const { status, body } = await call("/pengumuman", {
      method: "POST",
      body: formOf(VALID, [
        [png("poster.png"), "1"],
        [png("denah.png"), "0"],
      ]),
    });

    expect(status).toBe(201);
    expect(body.message).toBe("Berhasil Membuat Pengumuman");
    expect(body.data.code).toBe(`PGM-${TODAY.slice(0, 4)}-0010`);
    expect(
      (body.data as Row).listImage.map((file) => [
        file.name,
        file.showOnWebsite,
      ]),
    ).toEqual([
      ["poster", true],
      ["denah", false],
    ]);
    expect(announcementFeed(100).map((row) => row.id)).toContain(
      body.data.publicId,
    );
  });

  test("zod: semua issue, berakhir sebelum terbit ditolak, sama boleh", async () => {
    const bad = await call("/pengumuman", {
      method: "POST",
      body: formOf({
        ...VALID,
        title: "abc",
        content: "  ",
        category: "LAIN",
        expiryDate: "2000-01-01",
      }),
    });

    expect(bad.status).toBe(400);
    expect(
      bad.body.issues.map((issue: { path: string }) => issue.path),
    ).toEqual(["title", "content", "category", "expiryDate"]);

    const same = await call("/pengumuman", {
      method: "POST",
      body: formOf({ ...VALID, expiryDate: TODAY }),
    });
    expect(same.status).toBe(201);

    const noDate = await call("/pengumuman", {
      method: "POST",
      body: formOf({ ...VALID, publishDate: "" }),
    });
    expect(noDate.body.error).toBe(
      "Tanggal Terbit harus berupa tanggal yang valid",
    );
  });

  test("badan pelayanan tidak ada = 404 per field", async () => {
    const { status, body } = await call("/pengumuman", {
      method: "POST",
      body: formOf({ ...VALID, bapelId: "999" }),
    });

    expect(status).toBe(404);
    expect(body.issues).toEqual([
      { path: "bapelId", message: "Badan Pelayanan Tidak Ditemukan" },
    ]);
  });
});

describe("PUT /pengumuman/:code", () => {
  const retret = () => ANNOUNCEMENT.find((row) => row.id === 2)!;
  const filesOfRetret = async () =>
    ((await call(`/pengumuman/${retret().code}`)).body.data as Row).listImage;

  test("keepFiles memilih lampiran lama + bendera baru, berkas baru di belakang", async () => {
    const [poster] = await filesOfRetret();
    const { status, body } = await call(
      `/pengumuman/${retret().code.toLowerCase()}`,
      {
        method: "PUT",
        body: formOf(
          {
            ...VALID,
            keepFiles: JSON.stringify([
              { publicId: poster.publicId, showOnWebsite: false },
            ]),
          },
          [[png("baru.png"), "1"]],
        ),
      },
    );

    expect(status).toBe(200);
    expect(body.message).toBe("Berhasil Memperbarui Pengumuman");
    expect(
      (await filesOfRetret()).map((file) => [file.name, file.showOnWebsite]),
    ).toEqual([
      ["Poster Retret", false],
      ["baru", true],
    ]);
    expect((body.data as Row).expiryDate).toBeNull();
  });

  test("keepFiles [] menghapus semua; tanpa keepFiles dan tanpa berkas = tetap", async () => {
    await call(`/pengumuman/${retret().code}`, {
      method: "PUT",
      body: formOf(VALID),
    });
    expect(await filesOfRetret()).toHaveLength(2);

    await call(`/pengumuman/${retret().code}`, {
      method: "PUT",
      body: formOf({ ...VALID, keepFiles: "[]" }),
    });
    expect(await filesOfRetret()).toEqual([]);
  });

  test("keepFiles asing, format salah, dan lebih dari 4", async () => {
    const put = (
      fields: Record<string, string>,
      files: [File, string][] = [],
    ) =>
      call(`/pengumuman/${retret().code}`, {
        method: "PUT",
        body: formOf({ ...VALID, ...fields }, files),
      });

    expect(
      (await put({ keepFiles: '[{"publicId":"x","showOnWebsite":true}]' }))
        .body,
    ).toMatchObject({
      status: 400,
      error: "Lampiran Yang Dipertahankan Tidak Ditemukan",
    });
    expect((await put({ keepFiles: "{" })).body.issues[0].path).toBe(
      "keepFiles",
    );

    const files = await filesOfRetret();
    const tooMany = await put(
      {
        keepFiles: JSON.stringify(
          files.map(({ publicId, showOnWebsite }) => ({
            publicId,
            showOnWebsite,
          })),
        ),
      },
      [
        [png("a.png"), "0"],
        [png("b.png"), "0"],
        [png("c.png"), "0"],
      ],
    );
    expect(tooMany.body).toMatchObject({
      status: 400,
      issues: [
        {
          path: "listImage",
          message: "Lampiran Tidak Boleh Lebih Dari 4 File",
        },
      ],
    });
  });

  test("menarik terbitan menghilangkan dari feed dan website; kode asing 404", async () => {
    await call(`/pengumuman/${retret().code}`, {
      method: "PUT",
      body: formOf({ ...VALID, isPublished: "0" }),
    });

    expect(announcementFeed(100).map((row) => row.id)).not.toContain(
      retret().publicId,
    );
    expect(publicAnnouncements(100).map((row) => row.title)).not.toContain(
      VALID.title,
    );
    expect(
      (
        await call("/pengumuman/PGM-2026-9999", {
          method: "PUT",
          body: formOf(VALID),
        })
      ).status,
    ).toBe(404);
  });
});

test("DELETE hapus lunak; baris hilang dari daftar dan detail", async () => {
  const code = ANNOUNCEMENT[0].code;
  const { body } = await call(`/pengumuman/${code}`, { method: "DELETE" });

  expect(body.message).toBe("Berhasil Menghapus Pengumuman");
  expect(ANNOUNCEMENT[0].deletedAt).not.toBeNull();
  expect((await call(`/pengumuman/${code}`)).status).toBe(404);
  expect(
    (await call(`/pengumuman/${code}`, { method: "DELETE" }, ["VIEW"])).status,
  ).toBe(403);
});
