import { describe, expect, test } from "bun:test";

import {
  EMPTY_KARYAWAN_FORM,
  karyawanFormSchema,
  serverFieldError,
  toDigits,
  toKaryawanForm,
  toKaryawanPayload,
  type KaryawanFormValues,
} from "./model";
import type { Karyawan } from "./types";

const VALID: KaryawanFormValues = {
  jemaatId: "7",
  name: "Gideon Tampubolon",
  phone: "081234567803",
  email: "gideon@gereja.or.id",
  address: "Jl. Rawa Buntu 10",
  position: "Petugas Keamanan",
  joinDate: "2022-01-17",
  resignDate: "",
  status: "ACTIVE",
};

const errorsOf = (values: KaryawanFormValues) => {
  const parsed = karyawanFormSchema.safeParse(values);

  return parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

const fieldOf = (values: Partial<KaryawanFormValues>, field: string) =>
  errorsOf({ ...VALID, ...values })[field];

describe("skema: field wajib", () => {
  test("isian kosong menolak nama, telepon, jabatan, dan tanggal bergabung", () => {
    const errors = errorsOf(EMPTY_KARYAWAN_FORM);

    expect(Object.keys(errors).sort()).toEqual([
      "joinDate",
      "name",
      "phone",
      "position",
    ]);
  });

  test("isian lengkap lolos", () => {
    expect(errorsOf(VALID)).toEqual({});
  });

  test("jemaat, email, alamat, dan tanggal berhenti boleh kosong", () => {
    expect(
      errorsOf({
        ...VALID,
        jemaatId: "",
        email: "",
        address: "",
        resignDate: "",
      }),
    ).toEqual({});
  });
});

describe("skema: batas panjang dan format", () => {
  test("nama maksimal 150", () => {
    expect(fieldOf({ name: "a".repeat(150) }, "name")).toBeUndefined();
    expect(fieldOf({ name: "a".repeat(151) }, "name")).toBe(
      "Nama karyawan maksimal 150 karakter.",
    );
  });

  test("telepon maksimal 15 angka dan hanya angka", () => {
    expect(fieldOf({ phone: "1".repeat(15) }, "phone")).toBeUndefined();
    expect(fieldOf({ phone: "1".repeat(16) }, "phone")).toBe(
      "Nomor HP maksimal 15 angka.",
    );
    expect(fieldOf({ phone: "0812-345" }, "phone")).toBe(
      "Nomor HP hanya boleh angka.",
    );
    expect(fieldOf({ phone: "+62812345" }, "phone")).toBe(
      "Nomor HP hanya boleh angka.",
    );
  });

  test("email maksimal 150 dan harus nama@domain", () => {
    expect(fieldOf({ email: "a@b" }, "email")).toBeUndefined();
    expect(fieldOf({ email: "bukan-email" }, "email")).toBe(
      "Email harus berbentuk nama@domain.",
    );
    expect(fieldOf({ email: "a @b.id" }, "email")).toBe(
      "Email harus berbentuk nama@domain.",
    );
    expect(fieldOf({ email: `${"a".repeat(150)}@b.id` }, "email")).toBe(
      "Email maksimal 150 karakter.",
    );
  });

  test("alamat maksimal 250", () => {
    expect(fieldOf({ address: "a".repeat(250) }, "address")).toBeUndefined();
    expect(fieldOf({ address: "a".repeat(251) }, "address")).toBe(
      "Alamat maksimal 250 karakter.",
    );
  });

  test("jabatan maksimal 100", () => {
    expect(fieldOf({ position: "a".repeat(100) }, "position")).toBeUndefined();
    expect(fieldOf({ position: "a".repeat(101) }, "position")).toBe(
      "Jabatan maksimal 100 karakter.",
    );
  });

  test("status hanya tiga nilai", () => {
    expect(
      karyawanFormSchema.safeParse({ ...VALID, status: "CUTI" }).success,
    ).toBe(false);
    for (const status of ["ACTIVE", "RESIGNED", "TERMINATED"] as const) {
      const values = {
        ...VALID,
        status,
        resignDate: status === "ACTIVE" ? "" : "2026-02-01",
      };

      expect(errorsOf(values)).toEqual({});
    }
  });
});

// S19: koherensi status ↔ tanggal berhenti, dua arah. `/ddl/karyawan` menyaring
// `status: "ACTIVE"`, jadi satu baris tak koheren merusak picker setiap layar
// SDM lain — bukan hanya layar ini.
describe("skema: koherensi status dan tanggal berhenti (S19)", () => {
  test("ACTIVE dengan tanggal berhenti ditolak", () => {
    expect(
      fieldOf({ status: "ACTIVE", resignDate: "2026-02-01" }, "resignDate"),
    ).toBe("Hapus tanggal berhenti, atau ubah status jadi Berhenti.");
  });

  test("RESIGNED tanpa tanggal berhenti ditolak", () => {
    expect(fieldOf({ status: "RESIGNED", resignDate: "" }, "resignDate")).toBe(
      "Isi tanggal berhenti untuk status ini.",
    );
  });

  test("TERMINATED tanpa tanggal berhenti ditolak", () => {
    expect(
      fieldOf({ status: "TERMINATED", resignDate: "" }, "resignDate"),
    ).toBe("Isi tanggal berhenti untuk status ini.");
  });

  test("tanggal berhenti lebih awal dari bergabung ditolak", () => {
    expect(
      fieldOf(
        {
          status: "RESIGNED",
          joinDate: "2022-01-17",
          resignDate: "2022-01-16",
        },
        "resignDate",
      ),
    ).toBe("Tanggal berhenti tidak boleh lebih awal dari tanggal bergabung.");
  });

  test("tanggal berhenti sama dengan tanggal bergabung diterima", () => {
    expect(
      errorsOf({
        ...VALID,
        status: "RESIGNED",
        joinDate: "2022-01-17",
        resignDate: "2022-01-17",
      }),
    ).toEqual({});
  });
});

describe("payload", () => {
  test("tanggal dikirim YYYY-MM-DD, kosong jadi null", () => {
    expect(toKaryawanPayload(VALID)).toEqual({
      jemaatId: 7,
      name: "Gideon Tampubolon",
      phone: "081234567803",
      email: "gideon@gereja.or.id",
      address: "Jl. Rawa Buntu 10",
      position: "Petugas Keamanan",
      joinDate: "2022-01-17",
      resignDate: null,
      status: "ACTIVE",
    });
  });

  // PUT be-sada adalah replace penuh: field yang dihilangkan di-null-kan
  // service, jadi payload ubah WAJIB mengirim kesembilan field tiap kali.
  test("PUT replace penuh: sembilan kunci dikirim walau opsionalnya kosong", () => {
    const payload = toKaryawanPayload({
      ...VALID,
      jemaatId: "",
      email: "",
      address: "   ",
    });

    expect(Object.keys(payload).sort()).toEqual([
      "address",
      "email",
      "jemaatId",
      "joinDate",
      "name",
      "phone",
      "position",
      "resignDate",
      "status",
    ]);
    expect(payload.jemaatId).toBeNull();
    expect(payload.email).toBeNull();
    expect(payload.address).toBeNull();
  });

  test("nama dan jabatan dirapikan sebelum dikirim", () => {
    const payload = toKaryawanPayload({
      ...VALID,
      name: "  gideon   tampubolon ",
      position: "  Petugas  Keamanan  ",
    });

    expect(payload.name).toBe("Gideon Tampubolon");
    expect(payload.position).toBe("Petugas  Keamanan");
  });
});

describe("form dari respons baca", () => {
  const ROW: Karyawan = {
    id: 6,
    publicId: "karyawan-6",
    code: "KRY-0006",
    jemaatId: 12,
    jemaat: { id: 12, code: "JMT-0012", name: "Lidya Hutagalung" },
    name: "Lidya Hutagalung",
    phone: "081234567806",
    email: null,
    address: null,
    position: "Staf Keuangan",
    joinDate: "2018-05-02T00:00:00.000Z",
    resignDate: "2025-12-31T00:00:00.000Z",
    status: "RESIGNED",
  };

  test("tanggal jadi YYYY-MM-DD dan null jadi teks kosong", () => {
    expect(toKaryawanForm(ROW)).toEqual({
      jemaatId: "12",
      name: "Lidya Hutagalung",
      phone: "081234567806",
      email: "",
      address: "",
      position: "Staf Keuangan",
      joinDate: "2018-05-02",
      resignDate: "2025-12-31",
      status: "RESIGNED",
    });
  });

  test("baris hasil form bolak-balik tetap lolos skema", () => {
    expect(errorsOf(toKaryawanForm(ROW))).toEqual({});
  });
});

describe("pesan server ke field", () => {
  test("tanggal berhenti lebih awal mendarat di resignDate", () => {
    expect(
      serverFieldError(
        "Tanggal Berhenti Tidak Boleh Lebih Awal Dari Tanggal Bergabung",
      ),
    ).toEqual({
      field: "resignDate",
      message:
        "Tanggal berhenti tidak boleh lebih awal dari tanggal bergabung.",
    });
  });

  test("jemaat tidak ditemukan mendarat di jemaatId", () => {
    expect(serverFieldError("Jemaat Tidak Ditemukan")?.field).toBe("jemaatId");
  });

  // S30: bentuk penolakan yang diminta ke be-sada. Dipin ke keluarga ejaan,
  // bukan ke kalimat penuh, supaya pesan BE boleh berbeda kapitalisasinya.
  test("jemaat sudah punya karyawan aktif mendarat di jemaatId", () => {
    expect(
      serverFieldError("Jemaat Ini Sudah Terdaftar Sebagai Karyawan Aktif")
        ?.field,
    ).toBe("jemaatId");
    expect(
      serverFieldError("jemaat ini sudah terdaftar sebagai karyawan aktif")
        ?.field,
    ).toBe("jemaatId");
  });

  test("pesan lain tidak dipaksa ke field mana pun", () => {
    expect(serverFieldError("Kesalahan server.")).toBeNull();
    expect(serverFieldError("Karyawan Tidak Ditemukan")).toBeNull();
  });
});

describe("toDigits", () => {
  test("membuang bukan angka dan memotong di 15", () => {
    expect(toDigits("+62 812-3456-7890")).toBe("6281234567890");
    expect(toDigits("1".repeat(20))).toBe("1".repeat(15));
  });
});
