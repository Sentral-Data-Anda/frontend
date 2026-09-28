import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import {
  DOCUMENT_FILTER_OPTIONS,
  DOCUMENT_FORM_OPTIONS,
  EMPTY_SETELAN_FORM,
  EMPTY_TIER,
  rangeLabel,
  serverFieldError,
  setelanFormSchema,
  tierLabel,
  toSetelanForm,
  toSetelanPayload,
  toSetelanQuery,
  withSavedJabatan,
  withTierIssuePaths,
  type SetelanFormValues,
} from "./model";
import type { SetelanItem, SetelanStep } from "./types";

const role = (roleUserId: string) => ({ ...EMPTY_TIER, roleUserId });
const position = (roleName: string, bapelId = "") => ({
  kind: "position" as const,
  roleUserId: "",
  roleName,
  bapelId,
});

const VALID: SetelanFormValues = {
  ...EMPTY_SETELAN_FORM,
  name: "Kas keluar kecil",
  documentType: "CASH_EXPENSE",
  tiers: [role("4")],
};

const errorsOf = (values: Partial<SetelanFormValues>) => {
  const result = setelanFormSchema.safeParse({ ...VALID, ...values });

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

describe("skema form", () => {
  test("isian sah lolos", () => {
    expect(errorsOf({})).toEqual({});
  });

  test("nama wajib dan maksimal 100 karakter", () => {
    expect(errorsOf({ name: "  " }).name).toBe("Isi nama alur.");
    expect(errorsOf({ name: "a".repeat(101) }).name).toBe(
      "Nama alur maksimal 100 karakter.",
    );
    expect(errorsOf({ name: "a".repeat(100) }).name).toBeUndefined();
  });

  test("jenis dokumen wajib; LOAN_ROOM tidak bisa disimpan", () => {
    expect(errorsOf({ documentType: "" }).documentType).toBe(
      "Pilih jenis dokumen.",
    );
    expect(errorsOf({ documentType: "LOAN_ROOM" }).documentType).toMatch(
      /tidak bisa dipakai lagi/,
    );
  });

  test("nominal hanya digit", () => {
    expect(errorsOf({ minAmount: "1.000" }).minAmount).toBe(
      "Isi angka tanpa titik atau koma.",
    );
  });

  test("maksimal < minimal ditolak, sama boleh; pesan ikut satuan", () => {
    expect(errorsOf({ minAmount: "10", maxAmount: "5" }).maxAmount).toBe(
      "Nominal maksimal tidak boleh lebih kecil dari nominal minimal.",
    );
    expect(
      errorsOf({
        documentType: "LEAVE_REQUEST",
        minAmount: "4",
        maxAmount: "3",
      }).maxAmount,
    ).toMatch(/^Jumlah hari maksimal/);
    expect(errorsOf({ minAmount: "5", maxAmount: "5" })).toEqual({});
  });

  test("aturan tahap tetap berjalan walau nama kosong", () => {
    const errors = errorsOf({ name: "", tiers: [role(""), position("")] });

    expect(errors.name).toBeDefined();
    expect(errors["tiers.0.roleUserId"]).toBe("Pilih role penanda tangan.");
    expect(errors["tiers.1.roleName"]).toBe("Pilih nama jabatan.");
  });

  test("role sama di dua tahap: galat di tahap yang belakangan", () => {
    expect(errorsOf({ tiers: [role("4"), role("5"), role("4")] })).toEqual({
      "tiers.2.roleUserId":
        "Penanda tangan ini sudah ada di tahap 1. Pilih yang lain atau hapus tahap ini.",
    });
  });

  test("jabatan sama beda huruf/spasi di BP sama ditolak", () => {
    const errors = errorsOf({
      tiers: [position("Ketua", "2"), position(" ketua ", "2")],
    });

    expect(errors["tiers.1.roleName"]).toMatch(/sudah ada di tahap 1/);
  });

  test("jabatan sama di dua BP, atau BP pengaju vs BP tertentu, lolos", () => {
    expect(
      errorsOf({ tiers: [position("Ketua", "1"), position("Ketua", "2")] }),
    ).toEqual({});
    expect(
      errorsOf({ tiers: [position("Ketua"), position("Ketua", "2")] }),
    ).toEqual({});
  });

  test("1–10 tahap", () => {
    expect(errorsOf({ tiers: [] }).tiers).toBeDefined();
    expect(
      errorsOf({
        tiers: Array.from({ length: 11 }, (_, index) =>
          role(String(index + 1)),
        ),
      }).tiers,
    ).toBe("Maksimal 10 tahap.");
  });
});

const DETAIL: SetelanItem = {
  publicId: "cfg-1",
  name: "Kas keluar Komisi Pemuda",
  documentType: "CASH_EXPENSE",
  bapelId: 2,
  minAmount: "0",
  maxAmount: null,
  isActive: true,
  bapel: { code: "BPL-2", name: "Komisi Pemuda" },
  steps: [
    {
      publicId: "s1",
      order: 1,
      approverRoleUserId: null,
      approverRoleUser: null,
      approverRoleName: "Ketua",
      approverBapelId: null,
      approverBapel: null,
    },
    {
      publicId: "s2",
      order: 2,
      approverRoleUserId: null,
      approverRoleUser: null,
      approverRoleName: "Bendahara",
      approverBapelId: 1,
      approverBapel: { publicId: "b1", code: "BPL-1", name: "Majelis Jemaat" },
    },
    {
      publicId: "s3",
      order: 3,
      approverRoleUserId: 4,
      approverRoleUser: { publicId: "r4", name: "Bendahara" },
      approverRoleName: null,
      approverBapelId: null,
      approverBapel: null,
    },
  ],
};

describe("form ↔ payload", () => {
  test("detail → form → payload bolak-balik", () => {
    const values = toSetelanForm(DETAIL);

    expect(values.tiers.map((tier) => tier.kind)).toEqual([
      "position",
      "position",
      "role",
    ]);
    expect(toSetelanPayload(values)).toEqual({
      name: "Kas keluar Komisi Pemuda",
      documentType: "CASH_EXPENSE",
      bapelId: 2,
      minAmount: 0,
      maxAmount: null,
      isActive: true,
      tiers: [
        { roleUserId: null, roleName: "Ketua", bapelId: null },
        { roleUserId: null, roleName: "Bendahara", bapelId: 1 },
        { roleUserId: 4, roleName: null, bapelId: null },
      ],
    });
  });

  test("alur umum tanpa batas, nonaktif", () => {
    const payload = toSetelanPayload({
      ...VALID,
      isActive: "false",
      name: "  Program  ",
    });

    expect(payload).toMatchObject({
      name: "Program",
      bapelId: null,
      minAmount: null,
      maxAmount: null,
      isActive: false,
    });
  });

  test("desimal be-sada jadi isian digit", () => {
    const values = toSetelanForm({ ...DETAIL, maxAmount: "5000000.00" });

    expect(values.maxAmount).toBe("5000000");
  });
});

describe("label", () => {
  test("rangeLabel lima bentuk, rupiah vs hari", () => {
    expect(rangeLabel("CASH_EXPENSE", null, null)).toBe("Semua nominal");
    expect(rangeLabel("CASH_EXPENSE", "5000001", null)).toBe(
      "Mulai Rp 5.000.001",
    );
    expect(rangeLabel("CASH_EXPENSE", null, "5000000")).toBe(
      "Sampai Rp 5.000.000",
    );
    expect(rangeLabel("CASH_EXPENSE", "0", "5000000")).toBe(
      "Rp 0 – Rp 5.000.000",
    );
    expect(rangeLabel("LEAVE_REQUEST", "3", "3")).toBe("3 hari");
    expect(rangeLabel("LEAVE_REQUEST", "1", "3")).toBe("1 hari – 3 hari");
  });

  test("rangeLabel ringkas hanya untuk rupiah", () => {
    expect(rangeLabel("CASH_EXPENSE", "0", "5000000", true)).toMatch(
      /^Rp 0 – Rp 5\sjt$/,
    );
    expect(rangeLabel("LEAVE_REQUEST", "4", null, true)).toBe("Mulai 4 hari");
  });

  test("tierLabel role, jabatan BP tertentu, jabatan BP pengaju", () => {
    const [ketua, bendahara, roleStep] = DETAIL.steps as [
      SetelanStep,
      SetelanStep,
      SetelanStep,
    ];

    expect(tierLabel(roleStep)).toBe("Bendahara");
    expect(tierLabel(bendahara)).toBe("Bendahara · Majelis Jemaat");
    expect(tierLabel(ketua)).toBe("Ketua · BP pengaju");
  });

  test("opsi: form 9 jenis tanpa LOAN_ROOM, filter 10 + Semua", () => {
    expect(DOCUMENT_FORM_OPTIONS).toHaveLength(9);
    expect(
      DOCUMENT_FORM_OPTIONS.some((option) => option.value === "ASSET_DISPOSAL"),
    ).toBe(true);
    expect(
      DOCUMENT_FORM_OPTIONS.some((option) => option.value === "LOAN_ROOM"),
    ).toBe(false);
    expect(DOCUMENT_FILTER_OPTIONS).toHaveLength(11);
  });
});

describe("query daftar", () => {
  test("status URL jadi isActive, jenis tetap documentType", () => {
    expect(
      toSetelanQuery("page=1&limit=10&status=false&documentType=PROGRAM"),
    ).toBe("page=1&limit=10&documentType=PROGRAM&isActive=false");
    expect(toSetelanQuery("page=1&limit=10")).toBe("page=1&limit=10");
  });
});

describe("galat server", () => {
  test("409 tumpang tindih → minAmount", () => {
    expect(
      serverFieldError(
        "Sudah ada alur persetujuan aktif untuk jenis dokumen dan bapel ini pada rentang nominal yang bertumpang tindih.",
      )?.field,
    ).toBe("minAmount");
  });

  test("amount_valid → maxAmount; role/bapel hilang → root", () => {
    expect(
      serverFieldError(
        "Rentang nominal alur persetujuan tidak valid: nominal tidak boleh negatif",
      )?.field,
    ).toBe("maxAmount");
    expect(serverFieldError("Role Penyetuju Tidak Ditemukan")).toEqual({
      field: "root",
      message:
        "Salah satu role penanda tangan sudah dihapus. Pilih ulang role di tahapan.",
    });
    expect(serverFieldError("Bapel Tidak Ditemukan")?.field).toBe("root");
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });

  test("issue roleUserId pada tahap jabatan dipindah ke roleName", () => {
    const error = new FetchError(400, "x", [
      { path: "tiers.0.roleUserId", message: "a" },
      { path: "tiers.1.roleUserId", message: "b" },
      { path: "name", message: "c" },
    ]);
    const moved = withTierIssuePaths(error, [role("4"), position("Ketua")]);

    expect((moved as FetchError).issues.map((issue) => issue.path)).toEqual([
      "tiers.0.roleUserId",
      "tiers.1.roleName",
      "name",
    ]);
  });
});

describe("opsi Nama jabatan", () => {
  const options = [
    { value: "Bendahara", label: "Bendahara" },
    { value: "Ketua", label: "Ketua" },
  ];

  test("nilai tersimpan di luar daftar tetap tampil dan ditandai", () => {
    const saved = withSavedJabatan(options, "Penatua", true);

    expect(saved.options.at(-1)).toEqual({
      value: "Penatua",
      label: "Penatua",
    });
    expect(saved.isMissing).toBe(true);
  });

  test("beda huruf saja: tampil tapi tidak ditandai tak dipegang", () => {
    const saved = withSavedJabatan(options, "ketua", true);

    expect(saved.options).toHaveLength(3);
    expect(saved.isMissing).toBe(false);
  });

  test("selama memuat tidak ditandai; kosong tidak menambah opsi", () => {
    expect(withSavedJabatan([], "Ketua", false).isMissing).toBe(false);
    expect(withSavedJabatan(options, "", true).options).toBe(options);
  });
});
