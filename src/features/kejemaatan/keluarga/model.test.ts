import { describe, expect, test } from "bun:test";

import {
  EMPTY_KELUARGA_FORM,
  keluargaFormSchema,
  serverFieldError,
  toKeluargaForm,
  toKeluargaPayload,
  type KeluargaFormValues,
} from "./model";
import type { Keluarga } from "./types";

const VALID: KeluargaFormValues = {
  ...EMPTY_KELUARGA_FORM,
  name: "Keluarga Sitompul",
  provincesCode: "32",
  regenciesCode: "3273",
  districtsCode: "327301",
  villagesCode: "3273011001",
  address: "Jl. Merdeka 10, RT 01 RW 02",
};

const issuesOf = (values: KeluargaFormValues) => {
  const parsed = keluargaFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join("."));
};

describe("keluargaFormSchema", () => {
  test("isian lengkap tanpa wilayah lolos", () => {
    expect(issuesOf(VALID)).toEqual([]);
  });

  test("form kosong ditolak per field wajib, wilayah tidak", () => {
    expect(issuesOf(EMPTY_KELUARGA_FORM).sort()).toEqual([
      "address",
      "districtsCode",
      "name",
      "provincesCode",
      "regenciesCode",
      "villagesCode",
    ]);
  });

  test("nama hanya spasi dianggap kosong", () => {
    expect(issuesOf({ ...VALID, name: "   " })).toEqual(["name"]);
  });

  test("batas panjang be-sada: nama 100, alamat 250", () => {
    expect(issuesOf({ ...VALID, name: "a".repeat(100) })).toEqual([]);
    expect(issuesOf({ ...VALID, name: "a".repeat(101) })).toEqual(["name"]);
    expect(issuesOf({ ...VALID, address: "a".repeat(251) })).toEqual([
      "address",
    ]);
  });

  test("pesan wajib memberi contoh isian", () => {
    const parsed = keluargaFormSchema.safeParse({ ...VALID, name: "" });

    expect(parsed.error?.issues[0]?.message).toBe(
      "Nama keluarga wajib diisi, mis. Keluarga Sitompul.",
    );
  });
});

describe("toKeluargaPayload", () => {
  test("wilayah kosong dikirim null, beribadah di sini selalu dikirim", () => {
    expect(toKeluargaPayload(VALID)).toEqual({
      name: "Keluarga Sitompul",
      provincesCode: "32",
      regenciesCode: "3273",
      districtsCode: "327301",
      villagesCode: "3273011001",
      address: "Jl. Merdeka 10, RT 01 RW 02",
      zoneChurchId: null,
      worshipsHere: true,
    });
  });

  test("wilayah jadi angka, Tidak jadi false, teks dipangkas", () => {
    const payload = toKeluargaPayload({
      ...VALID,
      name: "  Keluarga Halim ",
      zoneChurchId: "3",
      worshipsHere: "false",
    });

    expect(payload.name).toBe("Keluarga Halim");
    expect(payload.zoneChurchId).toBe(3);
    expect(payload.worshipsHere).toBe(false);
  });
});

describe("toKeluargaForm", () => {
  const DETAIL: Keluarga = {
    id: 7,
    publicId: "10000000-0000-4000-8000-000000000007",
    code: "KK-0007",
    name: "Keluarga Saragih",
    provincesCode: "32",
    regenciesCode: "3273",
    districtsCode: "327301",
    villagesCode: "3273011001",
    address: "Jl. Cijerah 12",
    zoneChurchId: null,
    worshipsHere: false,
    zoneChurch: null,
    _count: { members: 2 },
  };

  test("null jadi string kosong, boolean jadi pilihan Ya/Tidak", () => {
    const values = toKeluargaForm(DETAIL);

    expect(values.zoneChurchId).toBe("");
    expect(values.worshipsHere).toBe("false");
    expect(toKeluargaPayload(values)).toEqual({
      name: DETAIL.name,
      provincesCode: DETAIL.provincesCode,
      regenciesCode: DETAIL.regenciesCode,
      districtsCode: DETAIL.districtsCode,
      villagesCode: DETAIL.villagesCode,
      address: DETAIL.address,
      zoneChurchId: null,
      worshipsHere: false,
    });
  });
});

describe("serverFieldError", () => {
  test("wilayah yang sudah dihapus mendarat di field wilayah", () => {
    expect(serverFieldError("Wilayah Gereja Tidak Ditemukan")?.field).toBe(
      "zoneChurchId",
    );
  });

  test("pesan lain tetap galat form", () => {
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});
