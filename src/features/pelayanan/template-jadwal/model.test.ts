import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import {
  EMPTY_TEMPLATE_JADWAL_FORM,
  rolesOf,
  serverFieldError,
  templateJadwalFormSchema,
  toTemplateJadwalForm,
  toTemplateJadwalPayload,
  withFormIssues,
  withSavedRole,
  type TemplateJadwalFormValues,
} from "./model";

const VALID: TemplateJadwalFormValues = {
  name: "Ibadah Minggu Pagi",
  bapelId: "1",
  startTime: "07:30",
  endTime: "10:00",
  slots: [{ roleId: "1" }, { roleId: "2" }, { roleId: "2" }],
};

const issuesOf = (values: TemplateJadwalFormValues) => {
  const parsed = templateJadwalFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("templateJadwalFormSchema", () => {
  test("isian lengkap lolos; tugas sama boleh berulang", () => {
    expect(issuesOf(VALID)).toEqual([]);
  });

  test("nama dinormalisasi lalu 4–50 karakter", () => {
    expect(issuesOf({ ...VALID, name: "   " })[0]).toBe(
      "name: Isi nama template, mis. Ibadah Minggu Pagi.",
    );
    expect(issuesOf({ ...VALID, name: " A  b " })).toEqual([
      "name: Nama template minimal 4 karakter.",
    ]);
    expect(issuesOf({ ...VALID, name: "x".repeat(51) })).toEqual([
      "name: Nama template maksimal 50 karakter.",
    ]);
    expect(issuesOf({ ...VALID, name: `  ${"x".repeat(50)}  ` })).toEqual([]);
  });

  test("badan pelayanan dan jam wajib", () => {
    expect(
      issuesOf({ ...VALID, bapelId: "", startTime: "", endTime: "" }),
    ).toEqual([
      "bapelId: Pilih badan pelayanan.",
      "startTime: Isi jam mulai.",
      "endTime: Isi jam selesai.",
    ]);
  });

  test("jam selesai sama dengan atau sebelum jam mulai ditolak di endTime", () => {
    const expected = ["endTime: Jam selesai harus sesudah jam mulai."];

    expect(issuesOf({ ...VALID, endTime: "07:30" })).toEqual(expected);
    expect(issuesOf({ ...VALID, endTime: "06:00" })).toEqual(expected);
  });

  test("galat jam tetap muncul walau nama dan tugas kosong", () => {
    expect(
      issuesOf({
        ...EMPTY_TEMPLATE_JADWAL_FORM,
        startTime: "10:00",
        endTime: "09:00",
      }),
    ).toContain("endTime: Jam selesai harus sesudah jam mulai.");
  });

  test("tanpa baris dan baris tanpa tugas ditolak", () => {
    expect(issuesOf({ ...VALID, slots: [] })).toEqual([
      "slots: Tambahkan minimal satu tugas.",
    ]);
    expect(
      issuesOf({ ...VALID, slots: [{ roleId: "1" }, { roleId: "" }] }),
    ).toEqual(["slots.1.roleId: Pilih tugas."]);
  });

  test("form tambah mulai dengan satu baris kosong", () => {
    expect(EMPTY_TEMPLATE_JADWAL_FORM.slots).toEqual([{ roleId: "" }]);
  });
});

describe("payload dan detail", () => {
  test("order 1..n mengikuti urutan baris, id numerik, nama dinormalisasi", () => {
    expect(
      toTemplateJadwalPayload({
        ...VALID,
        name: "  Ibadah   Pemuda ",
        slots: [{ roleId: "5" }, { roleId: "3" }, { roleId: "2" }],
      }),
    ).toEqual({
      bapelId: 1,
      name: "Ibadah Pemuda",
      startTime: "07:30",
      endTime: "10:00",
      detail: [
        { order: 1, rolePelayanId: 5 },
        { order: 2, rolePelayanId: 3 },
        { order: 3, rolePelayanId: 2 },
      ],
    });
  });

  test("slot detail yang tidak berurutan menjadi baris berurutan", () => {
    expect(
      toTemplateJadwalForm({
        id: 2,
        publicId: "x",
        code: "TMP_JDL_0002-0001",
        name: "Ibadah Pemuda",
        startTime: "17:00",
        endTime: "19:00",
        bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
        detail: [
          { order: 3, rolePelayanId: 5 },
          { order: 1, rolePelayanId: 3 },
          { order: 2, rolePelayanId: 2 },
        ],
      }),
    ).toEqual({
      name: "Ibadah Pemuda",
      bapelId: "2",
      startTime: "17:00",
      endTime: "19:00",
      slots: [{ roleId: "3" }, { roleId: "2" }, { roleId: "5" }],
    });
  });

  test("nama tugas daftar diurut order", () => {
    expect(
      rolesOf({
        code: "T",
        name: "T",
        startTime: "17:00",
        endTime: "19:00",
        bapel: "Komisi Pemuda",
        detail: [
          { order: 2, roleName: "Pemusik" },
          { order: 3, roleName: "Multimedia" },
          { order: 1, roleName: "Pemandu Pujian" },
        ],
      }),
    ).toEqual(["Pemandu Pujian", "Pemusik", "Multimedia"]);
  });

  test("tugas tersimpan yang tidak ada di ddl tampil sebagai Tugas terhapus", () => {
    const options = [{ value: "1", label: "Liturgis" }];

    expect(withSavedRole(options, "9", false)).toEqual([
      ...options,
      { value: "9", label: "Tugas terhapus" },
    ]);
    expect(withSavedRole(options, "9", true)).toBe(options);
    expect(withSavedRole(options, "1", false)).toBe(options);
    expect(withSavedRole(options, "", false)).toBe(options);
  });
});

describe("peta galat server", () => {
  test("nama ganda, 400 lama atau 409 baru, jatuh ke name", () => {
    const expected = {
      field: "name" as const,
      message: "Template dengan nama ini sudah ada. Pakai nama lain.",
    };

    expect(serverFieldError("Nama Template Sudah Tersedia")).toEqual(expected);
    expect(serverFieldError("nama template sudah tersedia")).toEqual(expected);
  });

  test("bapel ke bapelId, role terhapus tanpa issues ke galat form", () => {
    expect(serverFieldError("Bapel Tidak Ditemukan")?.field).toBe("bapelId");
    expect(serverFieldError("Role Pelayan Tidak Ditemukan")).toEqual({
      field: "root",
      message:
        "Salah satu tugas sudah dihapus. Muat ulang halaman lalu pilih lagi.",
    });
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });

  test("issues: detail.N ke slots.N, pesan dikenal diganti", () => {
    const mapped = withFormIssues(
      new FetchError(409, "Nama Template Sudah Tersedia", [
        { path: "name", message: "Nama Template Sudah Tersedia" },
        { path: "detail.2.rolePelayanId", message: "Role Pelayan wajib diisi" },
        {
          path: "detail.4.rolePelayanId",
          message: "Role Pelayan Tidak Ditemukan",
        },
        { path: "detail", message: "Minimal satu dalam Jadwal" },
      ]),
    ) as FetchError;

    expect(mapped.status).toBe(409);
    expect(mapped.issues).toEqual([
      {
        path: "name",
        message: "Template dengan nama ini sudah ada. Pakai nama lain.",
      },
      { path: "slots.2.roleId", message: "Role Pelayan wajib diisi" },
      {
        path: "slots.4.roleId",
        message: "Tugas ini sudah dihapus. Pilih tugas lain.",
      },
      { path: "slots", message: "Minimal satu dalam Jadwal" },
    ]);
  });

  test("galat tanpa issues dan galat jaringan diteruskan apa adanya", () => {
    const plain = new FetchError(500, "Kesalahan server.");
    const network = new TypeError("Failed to fetch");

    expect(withFormIssues(plain)).toBe(plain);
    expect(withFormIssues(network)).toBe(network);
  });
});
