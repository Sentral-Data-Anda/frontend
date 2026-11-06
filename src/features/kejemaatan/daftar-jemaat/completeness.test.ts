import { describe, expect, test } from "bun:test";

import {
  MISSING_FIELD_KEYS,
  MISSING_FIELD_LABEL,
  hasHardMissingFields,
  missingFieldLabels,
} from "./completeness";

describe("label kelengkapan jemaat", () => {
  test("setiap kunci punya label dan tidak ada kunci asing", () => {
    expect(Object.keys(MISSING_FIELD_LABEL).sort()).toEqual(
      [...MISSING_FIELD_KEYS].sort(),
    );

    for (const key of MISSING_FIELD_KEYS) {
      expect(MISSING_FIELD_LABEL[key].trim()).not.toBe("");
    }
  });

  test("label sama dengan yang dipakai form", () => {
    expect(MISSING_FIELD_LABEL).toEqual({
      birthPlace: "Tempat lahir",
      address: "Alamat lengkap",
      provincesCode: "Provinsi",
      regenciesCode: "Kabupaten/kota",
      districtsCode: "Kecamatan",
      villagesCode: "Kelurahan/desa",
      statusMarital: "Status pernikahan",
      ethnicGroupId: "Suku",
      codeInduk: "Kode induk",
    });
  });

  test("helper mempertahankan urutan dari server", () => {
    expect(missingFieldLabels(["ethnicGroupId", "codeInduk"])).toEqual([
      "Suku",
      "Kode induk",
    ]);
  });

  test("baris lengkap menghasilkan daftar label kosong", () => {
    expect(missingFieldLabels([])).toEqual([]);
  });
});

describe("garis kiri baris", () => {
  test("hanya field wajib simpan yang membuat baris bergaris", () => {
    expect(hasHardMissingFields([])).toBe(false);
    expect(hasHardMissingFields(["provincesCode", "villagesCode"])).toBe(false);
    expect(hasHardMissingFields(["birthPlace"])).toBe(true);
    expect(hasHardMissingFields(["address"])).toBe(true);
    expect(hasHardMissingFields(["statusMarital"])).toBe(true);
    expect(hasHardMissingFields(["ethnicGroupId"])).toBe(true);
    expect(hasHardMissingFields(["codeInduk"])).toBe(true);
  });
});
