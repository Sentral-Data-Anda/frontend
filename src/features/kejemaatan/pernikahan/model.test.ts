import { describe, expect, test } from "bun:test";

import {
  EMPTY_END_FORM,
  EMPTY_MARRIAGE_FORM,
  endMarriageFormSchema,
  marriageFormSchema,
  serverFieldError,
  toEndMarriagePayload,
  toMarriageForm,
  toMarriagePayload,
  type MarriageFormValues,
} from "./model";
import type { MarriageDetail } from "./types";

const VALID: MarriageFormValues = {
  ...EMPTY_MARRIAGE_FORM,
  husbandJemaatCode: "JMT-0001",
  wifeName: "Ruth Siregar",
};

const issuesOf = (values: MarriageFormValues) => {
  const parsed = marriageFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]);
};

describe("marriageFormSchema — tepat satu per sisi, pesan be-sada", () => {
  test("jemaat di satu sisi dan nama di sisi lain lolos", () => {
    expect(issuesOf(VALID)).toEqual([]);
  });

  test("dua sisi kosong: Mohon Lengkapi di field jemaat masing-masing", () => {
    expect(issuesOf(EMPTY_MARRIAGE_FORM)).toEqual([
      ["husbandJemaatCode", "Mohon Lengkapi Suami"],
      ["wifeJemaatCode", "Mohon Lengkapi Istri"],
    ]);
  });

  test("jemaat dan nama sekaligus ditolak", () => {
    expect(issuesOf({ ...VALID, husbandName: "Andreas" })).toEqual([
      [
        "husbandJemaatCode",
        "Isi salah satu saja untuk Suami: jemaat, atau nama",
      ],
    ]);
  });

  test("nama berisi spasi saja dianggap kosong", () => {
    expect(
      issuesOf({ ...VALID, husbandJemaatCode: "", husbandName: "   " }),
    ).toEqual([["husbandJemaatCode", "Mohon Lengkapi Suami"]]);
  });

  test("jemaat yang sama di dua sisi ditolak di sisi istri", () => {
    expect(
      issuesOf({ ...VALID, wifeName: "", wifeJemaatCode: "JMT-0001" }),
    ).toEqual([
      ["wifeJemaatCode", "Suami dan Istri tidak boleh jemaat yang sama"],
    ]);
  });

  test("batas panjang nama dan tempat", () => {
    expect(
      issuesOf({
        ...VALID,
        wifeName: "a".repeat(151),
        marriedPlace: "b".repeat(101),
      }).map(([path]) => path),
    ).toEqual(["wifeName", "marriedPlace"]);
  });
});

describe("toMarriagePayload", () => {
  test("tanggal kosong jadi null, bukan string kosong; blessedHere selalu dikirim", () => {
    expect(toMarriagePayload(VALID)).toEqual({
      husbandJemaatCode: "JMT-0001",
      husbandName: null,
      wifeJemaatCode: null,
      wifeName: "Ruth Siregar",
      marriedAt: null,
      marriedPlace: null,
      blessedHere: false,
    });
  });

  test("nilai terisi diteruskan dan dirapikan", () => {
    const payload = toMarriagePayload({
      ...VALID,
      marriedAt: "2012-06-16",
      marriedPlace: "  GKI Sada ",
      blessedHere: "true",
    });

    expect(payload.marriedAt).toBe("2012-06-16");
    expect(payload.marriedPlace).toBe("GKI Sada");
    expect(payload.blessedHere).toBe(true);
  });
});

describe("toMarriageForm", () => {
  const DETAIL: MarriageDetail = {
    id: "uuid-1",
    husband: { jemaatCode: "JMT-0001", name: "Andreas Sitanggang" },
    wife: { jemaatCode: null, name: "Ruth Siregar" },
    marriedAt: "2012-06-16T00:00:00.000Z",
    marriedPlace: null,
    blessedHere: true,
    endedAt: null,
    endReason: null,
    endNote: null,
  };

  test("sisi jemaat mengisi kode saja; sisi bukan jemaat mengisi nama saja", () => {
    expect(toMarriageForm(DETAIL)).toEqual({
      husbandJemaatCode: "JMT-0001",
      husbandName: "",
      wifeJemaatCode: "",
      wifeName: "Ruth Siregar",
      marriedAt: "2012-06-16",
      marriedPlace: "",
      blessedHere: "true",
    });
  });

  test("bolak-balik form → payload mempertahankan data", () => {
    expect(toMarriagePayload(toMarriageForm(DETAIL))).toEqual({
      husbandJemaatCode: "JMT-0001",
      husbandName: null,
      wifeJemaatCode: null,
      wifeName: "Ruth Siregar",
      marriedAt: "2012-06-16",
      marriedPlace: null,
      blessedHere: true,
    });
  });
});

describe("serverFieldError", () => {
  const LIVE =
    "Andreas Sitanggang Masih Tercatat Dalam Pernikahan Yang Belum Berakhir. Akhiri Pernikahan Tersebut Terlebih Dahulu";

  test("jemaat suami/istri tidak ditemukan dipetakan ke sisinya", () => {
    expect(serverFieldError("Suami Tidak Ditemukan", {})?.field).toBe(
      "husbandJemaatCode",
    );
    expect(serverFieldError("Istri Tidak Ditemukan", {})?.field).toBe(
      "wifeJemaatCode",
    );
  });

  test("masih menikah: sisi yang namanya cocok", () => {
    expect(
      serverFieldError(LIVE, {
        husbandJemaatCode: "Kevin Nainggolan",
        wifeJemaatCode: "Andreas Sitanggang",
      }),
    ).toEqual({ field: "wifeJemaatCode", message: LIVE });
  });

  test("masih menikah: nama yang jadi awalan nama lain tidak salah sisi", () => {
    const message =
      "Budi Santoso Masih Tercatat Dalam Pernikahan Yang Belum Berakhir. Akhiri Pernikahan Tersebut Terlebih Dahulu";

    expect(
      serverFieldError(message, {
        husbandJemaatCode: "Budi",
        wifeJemaatCode: "Budi Santoso",
      })?.field,
    ).toBe("wifeJemaatCode");
  });

  test("masih menikah dengan satu sisi jemaat: sisi itu", () => {
    expect(serverFieldError(LIVE, { husbandJemaatCode: "" })?.field).toBe(
      "husbandJemaatCode",
    );
  });

  test("masih menikah tanpa nama yang cocok: galat form", () => {
    expect(
      serverFieldError(LIVE, {
        husbandJemaatCode: "Kevin",
        wifeJemaatCode: "Lidya",
      }),
    ).toBeNull();
  });

  test("pesan lain: galat form", () => {
    expect(serverFieldError("Pernikahan Tidak Ditemukan", {})).toBeNull();
  });
});

describe("akhiri pernikahan", () => {
  test("tanggal dan alasan wajib", () => {
    const parsed = endMarriageFormSchema.safeParse(EMPTY_END_FORM);

    expect(
      parsed.success
        ? []
        : parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
    ).toEqual([
      ["endedAt", "Tanggal berakhir wajib diisi"],
      ["endReason", "Alasan berakhir wajib dipilih"],
    ]);
  });

  test("catatan maksimal 250 karakter", () => {
    const parsed = endMarriageFormSchema.safeParse({
      endedAt: "2024-01-01",
      endReason: "CERAI_HIDUP",
      endNote: "x".repeat(251),
    });

    expect(parsed.success).toBe(false);
  });

  test("catatan kosong dikirim null", () => {
    expect(
      toEndMarriagePayload({
        endedAt: "2024-01-01",
        endReason: "CERAI_MATI",
        endNote: " ",
      }),
    ).toEqual({
      endedAt: "2024-01-01",
      endReason: "CERAI_MATI",
      endNote: null,
    });
  });
});
