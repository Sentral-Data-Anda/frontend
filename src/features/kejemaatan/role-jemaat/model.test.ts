import { describe, expect, test } from "bun:test";

import {
  EMPTY_ROLE_JEMAAT_FORM,
  formatPeriode,
  roleJemaatFormSchema,
  serverFieldError,
  toRoleJemaatForm,
  toRoleJemaatPayload,
  yearOptions,
  type RoleJemaatFormValues,
} from "./model";
import type { RoleJemaatItem } from "./types";

const VALID: RoleJemaatFormValues = {
  jemaatId: "4",
  bapelId: "2",
  name: " Ketua ",
  startPeriode: "2025-01-01",
  endPeriode: "2026-12-31",
  status: "true",
};

const ITEM: RoleJemaatItem = {
  id: 7,
  publicId: "abc",
  name: "Ketua",
  startPeriode: "2025-01-01T00:00:00.000Z",
  endPeriode: "2026-12-31T00:00:00.000Z",
  status: false,
  jemaat: { id: 4, code: "JMT-0004", name: "Debora Manurung" },
  bapel: { id: 2, code: "BPL-0002", name: "Komisi Pemuda" },
};

const messagesOf = (values: RoleJemaatFormValues) => {
  const parsed = roleJemaatFormSchema.safeParse(values);

  return parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

describe("roleJemaatFormSchema", () => {
  test("isian lengkap lolos", () => {
    expect(roleJemaatFormSchema.safeParse(VALID).success).toBe(true);
  });

  test("form kosong: semua field wajib ditolak per field", () => {
    expect(Object.keys(messagesOf(EMPTY_ROLE_JEMAAT_FORM)).sort()).toEqual([
      "bapelId",
      "endPeriode",
      "jemaatId",
      "name",
      "startPeriode",
    ]);
    expect(messagesOf(EMPTY_ROLE_JEMAAT_FORM).jemaatId).toBe(
      "Mohon lengkapi jemaat",
    );
  });

  test("nama jabatan 2–50 karakter setelah trim", () => {
    expect(messagesOf({ ...VALID, name: " K " }).name).toBe(
      "Nama jabatan setidaknya 2 karakter",
    );
    expect(messagesOf({ ...VALID, name: "x".repeat(51) }).name).toBe(
      "Nama jabatan maksimal 50 karakter",
    );
  });

  test("tanggal selesai harus sesudah tanggal mulai", () => {
    expect(messagesOf({ ...VALID, endPeriode: "2025-01-01" }).endPeriode).toBe(
      "Tanggal selesai harus setelah tanggal mulai periode.",
    );
    expect(messagesOf({ ...VALID, endPeriode: "2024-12-31" })).toHaveProperty(
      "endPeriode",
    );
  });
});

describe("form ↔ payload", () => {
  test("payload: angka untuk id, boolean untuk status, nama di-trim", () => {
    expect(toRoleJemaatPayload(VALID)).toEqual({
      name: "Ketua",
      startPeriode: "2025-01-01",
      endPeriode: "2026-12-31",
      status: true,
      jemaatId: 4,
      bapelId: 2,
    });
    expect(toRoleJemaatPayload({ ...VALID, status: "false" }).status).toBe(
      false,
    );
  });

  test("detail be-sada menjadi nilai form string", () => {
    expect(toRoleJemaatForm(ITEM)).toEqual({
      jemaatId: "4",
      bapelId: "2",
      name: "Ketua",
      startPeriode: "2025-01-01",
      endPeriode: "2026-12-31",
      status: "false",
    });
  });

  test("bapel null (data lama) menjadi pilihan kosong yang wajib diisi ulang", () => {
    expect(toRoleJemaatForm({ ...ITEM, bapel: null }).bapelId).toBe("");
  });
});

describe("serverFieldError", () => {
  test("409 tumpang tindih jadi galat form: penyebabnya bisa di field mana pun", () => {
    expect(
      serverFieldError(
        "Jemaat tersebut sudah menjabat peran yang sama di Bapel ini pada periode yang bertumpang tindih",
      )?.field,
    ).toBe("root");
  });

  test("jemaat/bapel tidak ditemukan mendarat di pilihannya", () => {
    expect(serverFieldError("Jemaat Tidak Ditemukan")?.field).toBe("jemaatId");
    expect(serverFieldError("Bapel Tidak Ditemukan")?.field).toBe("bapelId");
  });

  test("pesan lain tetap galat form", () => {
    expect(serverFieldError("Role Jemaat Tidak Ditemukan")).toBeNull();
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});

describe("tampilan daftar", () => {
  test("periode ringkas bulan pendek", () => {
    expect(formatPeriode(ITEM)).toBe("1 Jan 2025 – 31 Des 2026");
  });

  test("tahun berjalan ± 5, terbaru di atas, plus Semua tahun", () => {
    const options = yearOptions("2026-09-26");

    expect(options[0]).toEqual({ value: "", label: "Semua tahun" });
    expect(options.slice(1).map((option) => option.value)).toEqual([
      "2031",
      "2030",
      "2029",
      "2028",
      "2027",
      "2026",
      "2025",
      "2024",
      "2023",
      "2022",
      "2021",
    ]);
  });
});
