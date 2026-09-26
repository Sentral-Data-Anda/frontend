import { describe, expect, test } from "bun:test";

import {
  EMPTY_RIWAYAT_FORM,
  riwayatFormSchema,
  serverFieldError,
  toRiwayatForm,
  toRiwayatPayload,
  type RiwayatFormValues,
} from "./model";

const FILLED: RiwayatFormValues = {
  jemaatCode: "JMT-0001",
  type: "BAPTIS",
  date: "1990-06-17",
  certificateNumber: "",
  place: "",
};

const issuesOf = (values: RiwayatFormValues) => {
  const parsed = riwayatFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]);
};

describe("riwayatFormSchema", () => {
  test("form kosong: jemaat, jenis, dan tanggal wajib; nomor surat dan tempat tidak", () => {
    expect(issuesOf(EMPTY_RIWAYAT_FORM)).toEqual([
      [
        "jemaatCode",
        "Jemaat wajib dipilih; ketik namanya lalu pilih dari daftar.",
      ],
      ["type", "Jenis riwayat wajib dipilih"],
      ["date", "Tanggal riwayat wajib diisi"],
    ]);
  });

  test("tanpa nomor surat dan tempat lolos", () => {
    expect(issuesOf(FILLED)).toEqual([]);
  });

  test("batas panjang dihitung sesudah trim, seperti be-sada", () => {
    expect(
      issuesOf({ ...FILLED, certificateNumber: ` ${"a".repeat(50)} ` }),
    ).toEqual([]);
    expect(issuesOf({ ...FILLED, certificateNumber: "a".repeat(51) })).toEqual([
      ["certificateNumber", "Nomor surat maksimal 50 karakter"],
    ]);
    expect(issuesOf({ ...FILLED, place: "a".repeat(101) })).toEqual([
      ["place", "Tempat maksimal 100 karakter"],
    ]);
  });
});

describe("toRiwayatPayload / toRiwayatForm", () => {
  test("opsional kosong jadi null, isian di-trim, tanggal wajib tetap string", () => {
    expect(
      toRiwayatPayload({
        ...FILLED,
        place: "  GKI Samanhudi ",
        certificateNumber: "  ",
      }),
    ).toEqual({
      jemaatCode: "JMT-0001",
      type: "BAPTIS",
      date: "1990-06-17",
      certificateNumber: null,
      place: "GKI Samanhudi",
    });
  });

  test("detail be-sada jadi nilai form string", () => {
    expect(
      toRiwayatForm({
        id: "uuid-1",
        type: "SIDI",
        typeLabel: "Sidi",
        date: "2006-04-16T00:00:00.000Z",
        certificateNumber: null,
        place: "GKI Samanhudi",
        jemaat: { code: "JMT-0001", name: "Andreas Sitanggang" },
      }),
    ).toEqual({
      jemaatCode: "JMT-0001",
      type: "SIDI",
      date: "2006-04-16",
      certificateNumber: "",
      place: "GKI Samanhudi",
    });
  });
});

describe("serverFieldError", () => {
  test("409 sekali per jemaat mendarat di Jenis dengan arahan", () => {
    expect(
      serverFieldError("Andreas Sitanggang Sudah Memiliki Riwayat Baptis"),
    ).toEqual({
      field: "type",
      message:
        "Andreas Sitanggang Sudah Memiliki Riwayat Baptis. Pilih jenis lain, atau ubah riwayat yang sudah ada.",
    });
  });

  test("jemaat hilang mendarat di Jemaat; riwayat hilang tetap galat form", () => {
    expect(serverFieldError("Jemaat Tidak Ditemukan")?.field).toBe(
      "jemaatCode",
    );
    expect(serverFieldError("Riwayat Jemaat Tidak Ditemukan")).toBeNull();
  });
});
