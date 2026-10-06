import { describe, expect, test } from "bun:test";

import {
  assignableOptions,
  EMPTY_KOMPONEN_FORM,
  EMPTY_PENETAPAN_FORM,
  KATALOG_LIST_PATH,
  PENETAPAN_CREATE_PATH,
  PENETAPAN_LIST_PATH,
  assignmentValueText,
  defaultValueText,
  isManaged,
  katalogEditHref,
  komponenFormSchema,
  komponenServerFieldError,
  penetapanEditHref,
  penetapanFormSchema,
  penetapanServerFieldError,
  toKomponenForm,
  toKomponenPayload,
  toPenetapanForm,
  toPenetapanPayload,
  type KomponenFormValues,
  type PenetapanFormValues,
} from "./model";
import type {
  KomponenPayroll,
  KomponenPayrollOption,
  PenetapanKomponen,
} from "./types";

const komponen = (
  values: Partial<KomponenFormValues> = {},
): KomponenFormValues => ({
  ...EMPTY_KOMPONEN_FORM,
  name: "Transport",
  defaultValue: "350000",
  ...values,
});

const penetapan = (
  values: Partial<PenetapanFormValues> = {},
): PenetapanFormValues => ({
  ...EMPTY_PENETAPAN_FORM,
  karyawanId: "1",
  payrollComponentId: "2",
  value: "250000",
  effectiveFrom: "2026-01-01",
  ...values,
});

const assignedComponent = (
  calculationType: "FIXED" | "PERCENTAGE",
): PenetapanKomponen["payrollComponent"] => ({
  publicId: "kpy-4",
  code: "KPY-0004",
  name: "Iuran BPJS",
  type: "DEDUCTION",
  calculationType,
  defaultValue: "1.00",
  isActive: true,
});

const issuesOf = (result: {
  success: boolean;
  error?: { issues: unknown[] };
}) =>
  (result.error?.issues ?? []) as {
    path: (string | number)[];
    message: string;
  }[];

const fieldsOf = (values: KomponenFormValues | PenetapanFormValues) => {
  const schema =
    "defaultValue" in values ? komponenFormSchema : penetapanFormSchema;
  const result = schema.safeParse(values);

  return issuesOf(result).map((issue) => String(issue.path[0]));
};

describe("rute dua layar", () => {
  test("katalog memakai code, penetapan memakai publicId", () => {
    expect(KATALOG_LIST_PATH).toBe("/sdm/komponen-payroll");
    expect(katalogEditHref("KPY-0001")).toBe(
      "/sdm/komponen-payroll/KPY-0001/ubah",
    );
    expect(PENETAPAN_LIST_PATH).toBe("/sdm/komponen-payroll/karyawan");
    expect(PENETAPAN_CREATE_PATH).toBe("/sdm/komponen-payroll/karyawan/baru");
    expect(penetapanEditHref("a b/c")).toBe(
      "/sdm/komponen-payroll/karyawan/a%20b%2Fc/ubah",
    );
  });
});

describe("skema katalog", () => {
  test("nama 100 diterima, 101 ditolak", () => {
    expect(fieldsOf(komponen({ name: "x".repeat(100) }))).toEqual([]);
    expect(fieldsOf(komponen({ name: "x".repeat(101) }))).toEqual(["name"]);
    expect(fieldsOf(komponen({ name: "   " }))).toEqual(["name"]);
  });

  test("persentase 100 diterima, 101 ditolak", () => {
    const percentage = (defaultValue: string) =>
      komponen({ calculationType: "PERCENTAGE", defaultValue });

    expect(fieldsOf(percentage("100"))).toEqual([]);
    expect(fieldsOf(percentage("101"))).toEqual(["defaultValue"]);
  });

  test("nominal di atas 100 tetap diterima saat cara hitung FIXED", () => {
    expect(fieldsOf(komponen({ defaultValue: "350000" }))).toEqual([]);
  });

  test("nilai 0 dan kosong ditolak; mode per orang melewatkan keduanya", () => {
    expect(fieldsOf(komponen({ defaultValue: "0" }))).toEqual(["defaultValue"]);
    expect(fieldsOf(komponen({ defaultValue: "" }))).toEqual(["defaultValue"]);
    expect(
      fieldsOf(komponen({ valueMode: "kosong", defaultValue: "" })),
    ).toEqual([]);
  });

  test("payload: per orang mengirim null, bukan 0 dan bukan dihilangkan", () => {
    const payload = toKomponenPayload(
      komponen({ valueMode: "kosong", defaultValue: "350000" }),
    );

    expect(payload.defaultValue).toBeNull();
    expect("defaultValue" in payload).toBe(true);
    expect(
      toKomponenPayload(komponen({ defaultValue: "350000" })).defaultValue,
    ).toBe(350000);
  });

  test("payload: akun kosong jadi null, nama dirapikan", () => {
    const payload = toKomponenPayload(
      komponen({ name: "  Tunjangan   Transport ", accountId: "" }),
    );

    expect(payload.accountId).toBeNull();
    expect(payload.name).toBe("Tunjangan Transport");
    expect(toKomponenPayload(komponen({ accountId: "23" })).accountId).toBe(23);
  });

  test("bentuk form dari respons baca", () => {
    const row: KomponenPayroll = {
      id: 2,
      code: "KPY-0002",
      name: "Tunjangan Jabatan",
      type: "EARNING",
      calculationType: "FIXED",
      defaultValue: null,
      isTaxable: true,
      isActive: false,
      accountId: null,
    };

    expect(toKomponenForm(row)).toEqual({
      name: "Tunjangan Jabatan",
      type: "EARNING",
      calculationType: "FIXED",
      valueMode: "kosong",
      defaultValue: "",
      isTaxable: "true",
      isActive: "false",
      accountId: "",
    });
  });
});

describe("skema penetapan", () => {
  test("berlaku sampai sama hari diterima, sehari sebelum ditolak", () => {
    expect(fieldsOf(penetapan({ effectiveTo: "2026-01-01" }))).toEqual([]);
    expect(fieldsOf(penetapan({ effectiveTo: "2025-12-31" }))).toEqual([
      "effectiveTo",
    ]);
    expect(fieldsOf(penetapan({ effectiveTo: "" }))).toEqual([]);
  });

  test("karyawan, komponen, dan tanggal mulai wajib", () => {
    expect(
      fieldsOf(
        penetapan({
          karyawanId: "",
          payrollComponentId: "",
          effectiveFrom: "",
        }),
      ).sort(),
    ).toEqual(["effectiveFrom", "karyawanId", "payrollComponentId"]);
  });

  test("persentase di atas 100 ditolak, 100 diterima", () => {
    const percentage = (value: string) =>
      penetapan({ calculationType: "PERCENTAGE", value });

    expect(fieldsOf(percentage("100"))).toEqual([]);
    expect(fieldsOf(percentage("101"))).toEqual(["value"]);
    // 999 lolos `maxDigits`, jadi batasnya harus di skema.
    expect(fieldsOf(percentage("999"))).toEqual(["value"]);
    // Nominal di atas 100 tetap sah.
    expect(fieldsOf(penetapan({ value: "250000" }))).toEqual([]);
  });

  test("nilai wajib saat mode sendiri, dilewati saat pakai default", () => {
    expect(fieldsOf(penetapan({ value: "" }))).toEqual(["value"]);
    expect(fieldsOf(penetapan({ value: "0" }))).toEqual(["value"]);
    expect(fieldsOf(penetapan({ valueMode: "kosong", value: "" }))).toEqual([]);
  });

  test("payload: tanggal YYYY-MM-DD, nilai null terkirim sebagai null", () => {
    const payload = toPenetapanPayload(
      penetapan({ valueMode: "kosong", value: "", effectiveTo: "" }),
    );

    expect(payload.effectiveFrom).toBe("2026-01-01");
    expect(payload.effectiveTo).toBeNull();
    expect(payload.value).toBeNull();
    expect("value" in payload).toBe(true);
    expect(payload.karyawanId).toBe(1);
    expect(payload.payrollComponentId).toBe(2);
  });

  test("bentuk form memotong tanggal ISO dari server", () => {
    const row: PenetapanKomponen = {
      publicId: "kkp-1",
      karyawanId: 4,
      payrollComponentId: 5,
      value: null,
      effectiveFrom: "2026-02-01T00:00:00.000Z",
      effectiveTo: "2026-06-30T00:00:00.000Z",
      karyawan: { publicId: "kry-4", code: "KRY-0004", name: "Dewi" },
      payrollComponent: {
        publicId: "kpy-5",
        code: "KPY-0005",
        name: "Koperasi",
        type: "DEDUCTION",
        calculationType: "FIXED",
        defaultValue: "100000.00",
        isActive: false,
      },
    };

    expect(toPenetapanForm(row)).toEqual({
      karyawanId: "4",
      payrollComponentId: "5",
      calculationType: "FIXED",
      valueMode: "kosong",
      value: "",
      effectiveFrom: "2026-02-01",
      effectiveTo: "2026-06-30",
    });
  });
});

describe("teks nilai", () => {
  const row = (values: Partial<KomponenPayroll> = {}): KomponenPayroll => ({
    id: 1,
    code: "KPY-0001",
    name: "Transport",
    type: "EARNING",
    calculationType: "FIXED",
    defaultValue: "350000.00",
    isTaxable: true,
    isActive: true,
    accountId: null,
    ...values,
  });

  test("null berarti Per orang, bukan tanda hubung", () => {
    expect(defaultValueText(row({ defaultValue: null }))).toBe("Per orang");
  });

  test("nol rupiah tetap angka", () => {
    expect(defaultValueText(row({ defaultValue: "0.00" }))).toBe("Rp 0");
  });

  test("persentase memakai persen, bukan rupiah", () => {
    expect(
      defaultValueText(
        row({ calculationType: "PERCENTAGE", defaultValue: "1.00" }),
      ),
    ).toBe("1%");
  });

  test("nilai penetapan null berarti default komponen", () => {
    const assignment = (value: string | null) =>
      ({
        value,
        payrollComponent: assignedComponent("FIXED"),
      }) as PenetapanKomponen;

    expect(assignmentValueText(assignment(null))).toBe("Default komponen");
    expect(assignmentValueText(assignment("0.00"))).toBe("Rp 0");
  });

  test("penetapan persentase dibaca persen, bukan rupiah", () => {
    const assignment = {
      value: "2.00",
      payrollComponent: assignedComponent("PERCENTAGE"),
    } as PenetapanKomponen;

    expect(assignmentValueText(assignment)).toBe("2%");
  });
});

describe("baris yang dikelola sistem", () => {
  test("hanya PPH21, dan dikenali dari kodenya", () => {
    expect(isManaged({ code: "PPH21" })).toBe(true);
    expect(isManaged({ code: "KPY-0001" })).toBe(false);
    expect(isManaged({ code: "pph21" })).toBe(false);
  });
});

describe("komponen yang dikelola sistem tidak ditawarkan ke penetapan", () => {
  const rows: KomponenPayrollOption[] = [
    {
      id: 1,
      code: "KPY-0001",
      name: "Transport",
      type: "EARNING",
      calculationType: "FIXED",
      defaultValue: "350000.00",
    },
    {
      id: 6,
      code: "PPH21",
      name: "PPh21",
      type: "DEDUCTION",
      calculationType: "FIXED",
      defaultValue: null,
    },
  ];
  const options = [
    { value: "1", label: "Transport" },
    { value: "6", label: "PPh21" },
  ];

  test("PPh21 dibuang dari opsi, sisanya utuh", () => {
    expect(assignableOptions(rows, options)).toEqual([
      { value: "1", label: "Transport" },
    ]);
  });

  test("tanpa baris PPh21 nol opsi hilang", () => {
    expect(assignableOptions([rows[0]], [options[0]])).toEqual([options[0]]);
  });
});

describe("pesan server ke field", () => {
  test("katalog", () => {
    expect(
      komponenServerFieldError("Komponen Payroll Sudah Tersedia")?.field,
    ).toBe("name");
    expect(komponenServerFieldError("Akun 5-900 Sudah Tidak Aktif")).toEqual({
      field: "accountId",
      message: "Akun 5-900 Sudah Tidak Aktif",
    });
    expect(komponenServerFieldError("Entah apa")).toBeNull();
  });

  test("penetapan: nilai wajib jatuh ke field nilai", () => {
    expect(
      penetapanServerFieldError(
        "Nilai Komponen Harus Diisi Karena Komponen Ini Tidak Punya Nilai Default",
      )?.field,
    ).toBe("value");
    expect(penetapanServerFieldError("Karyawan Tidak Ditemukan")?.field).toBe(
      "karyawanId",
    );
  });

  test("penetapan: bentrokan periode menyorot tanggal, bukan galat tingkat form", () => {
    expect(
      penetapanServerFieldError(
        "Karyawan ini sudah mendapat komponen tersebut pada periode yang dipilih. Ubah periodenya atau akhiri penetapan yang lama",
      )?.field,
    ).toBe("effectiveFrom");
  });
});
