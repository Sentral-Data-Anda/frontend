import { describe, expect, test } from "bun:test";

import type { AttachmentValue } from "@/types/attachment";

import {
  EMPTY_RUANG_FORM,
  groupUsage,
  ruangFormSchema,
  serverFieldError,
  toRuangForm,
  toRuangFormData,
  usageDayOf,
} from "./model";
import type { RoomDetail } from "./types";

const saved = (key: string): AttachmentValue => ({
  key,
  name: key,
  mimeType: "image/jpeg",
  url: `http://media/${key}.jpeg`,
  showOnWebsite: false,
  file: null,
});

const picked = (name: string): AttachmentValue => ({
  key: name,
  name,
  mimeType: "image/jpeg",
  url: `blob:${name}`,
  showOnWebsite: false,
  file: new File([new Uint8Array(4)], name, { type: "image/jpeg" }),
});

const valid = { ...EMPTY_RUANG_FORM, name: "aula serbaguna", capacity: "150" };

const issuesOf = (values: typeof valid) => {
  const parsed = ruangFormSchema.safeParse(values);

  return parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

describe("skema ruang", () => {
  test("nama dinormalisasi; foto opsional", () => {
    const parsed = ruangFormSchema.parse({
      ...valid,
      name: "  aula   serbaguna ",
    });

    expect(parsed.name).toBe("Aula Serbaguna");
    expect(parsed.mainImage).toEqual([]);
  });

  test("nama 4–100 karakter sesudah normalisasi", () => {
    expect(issuesOf({ ...valid, name: " ab  " }).name).toBe(
      "Isi nama ruang, minimal 4 karakter",
    );
    expect(issuesOf({ ...valid, name: "a".repeat(101) }).name).toBe(
      "Nama ruang maksimal 100 karakter",
    );
  });

  test("kapasitas bilangan bulat ≥ 1", () => {
    for (const capacity of ["", "0", "1.5", "-2"]) {
      expect(issuesOf({ ...valid, capacity }).capacity).toBe(
        "Kapasitas minimal 1 orang",
      );
    }
    expect(issuesOf({ ...valid, capacity: "1" })).toEqual({});
  });

  test("foto detail maksimal 4", () => {
    expect(
      issuesOf({
        ...valid,
        detailImage: ["a", "b", "c", "d", "e"].map(saved),
      }).detailImage,
    ).toBe("Foto detail maksimal 4");
  });
});

describe("payload multipart", () => {
  test("tambah: isActive selalu dikirim, tanpa keepFiles, tanpa berkas bila kosong", () => {
    const body = toRuangFormData({ ...valid, isActive: "true" }, false);

    expect(body.get("name")).toBe("Aula Serbaguna");
    expect(body.get("capacity")).toBe("150");
    expect(body.get("isActive")).toBe("1");
    expect(body.has("keepFiles")).toBe(false);
    expect(body.has("mainImage")).toBe(false);
    expect(body.has("image")).toBe(false);
    expect(body.has("showOnWebsite")).toBe(false);
  });

  test('ruang nonaktif mengirim isActive "0"', () => {
    expect(
      toRuangFormData({ ...valid, isActive: "false" }, true).get("isActive"),
    ).toBe("0");
  });

  test("mainImage hanya bila berkas baru; image berurutan", () => {
    const body = toRuangFormData(
      {
        ...valid,
        mainImage: [picked("utama.jpg")],
        detailImage: [picked("satu.jpg"), picked("dua.jpg")],
      },
      false,
    );

    expect((body.get("mainImage") as File).name).toBe("utama.jpg");
    expect(body.getAll("image").map((file) => (file as File).name)).toEqual([
      "satu.jpg",
      "dua.jpg",
    ]);

    const kept = toRuangFormData({ ...valid, mainImage: [saved("m1")] }, true);
    expect(kept.has("mainImage")).toBe(false);
  });

  test("ubah: keepFiles berisi foto lama yang tersisa, [] bila semua dilepas", () => {
    const body = toRuangFormData(
      { ...valid, detailImage: [saved("d1"), picked("baru.jpg"), saved("d3")] },
      true,
    );

    expect(JSON.parse(String(body.get("keepFiles")))).toEqual([
      { publicId: "d1", showOnWebsite: false },
      { publicId: "d3", showOnWebsite: false },
    ]);
    expect(body.getAll("image")).toHaveLength(1);
    expect(toRuangFormData(valid, true).get("keepFiles")).toBe("[]");
  });

  test("detail → isian form", () => {
    const room: RoomDetail = {
      id: 5,
      publicId: "r5",
      code: "RM-0005",
      name: "Kelas Sekolah Minggu",
      capacity: 40,
      isActive: false,
      mainImage: null,
      detailImage: [
        {
          publicId: "d1",
          name: "Sudut baca",
          mimeType: "image/jpeg",
          size: 1,
          showOnWebsite: false,
          url: "http://media/d1.jpeg",
        },
      ],
    };

    expect(toRuangForm(room)).toMatchObject({
      capacity: "40",
      isActive: "false",
      mainImage: [],
      detailImage: [{ key: "d1", file: null }],
    });
  });
});

test("galat server: nama kembar ke field nama", () => {
  expect(serverFieldError("Ruang Sudah Tersedia")).toEqual({
    field: "name",
    message: "Ruang dengan nama ini sudah ada. Pakai nama lain.",
  });
  expect(serverFieldError("Kesalahan server.")).toBeNull();
});

test("pemakaian dikelompokkan per tanggal kalender", () => {
  const row = (date: string, startTime: string) => ({
    kind: "LOAN" as const,
    code: `LR-${date}-${startTime}`,
    name: "Latihan paduan suara",
    date,
    startTime,
    endTime: "21:00",
  });

  const days = groupUsage([
    row("2026-10-01", "07:00"),
    row("2026-10-01", "19:00"),
    row("2026-10-02", "19:00"),
  ]);

  expect(days.map((day) => [day.date, day.rows.length])).toEqual([
    ["2026-10-01", 2],
    ["2026-10-02", 1],
  ]);
  expect(usageDayOf("2026-10-01")).toBe("Kamis, 1 Okt 2026");
});
