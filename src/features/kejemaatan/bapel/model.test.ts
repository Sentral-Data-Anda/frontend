import { describe, expect, test } from "bun:test";

import {
  EMPTY_RULE,
  bapelFormSchema,
  serverFieldError,
  summarizeRules,
  toBapelForm,
  toBapelPayload,
  type BapelFormValues,
  type BapelRuleValues,
} from "./model";
import type { BapelDetail, BapelRule } from "./types";

const rule = (next: Partial<BapelRuleValues>): BapelRuleValues => ({
  ...EMPTY_RULE,
  ...next,
});

const VALID: BapelFormValues = { name: "Komisi Pemuda", rules: [] };

const issuesOf = (values: BapelFormValues) => {
  const parsed = bapelFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("bapelFormSchema — nama", () => {
  test("nama 4–25 karakter lolos, tanpa aturan pun", () => {
    expect(issuesOf(VALID)).toEqual([]);
  });

  test("kosong, terlalu pendek, dan terlalu panjang ditolak dengan pesannya", () => {
    expect(issuesOf({ ...VALID, name: "  " })[0]).toBe(
      "name: Nama wajib diisi",
    );
    expect(issuesOf({ ...VALID, name: "Abc" })).toEqual([
      "name: Nama minimal 4 karakter",
    ]);
    expect(issuesOf({ ...VALID, name: "x".repeat(26) })).toEqual([
      "name: Nama maksimal 25 karakter",
    ]);
  });
});

describe("bapelFormSchema — aturan", () => {
  test("jenis kosong ditolak", () => {
    expect(issuesOf({ ...VALID, rules: [rule({})] })).toEqual([
      "rules.0.type: Jenis aturan wajib dipilih",
    ]);
  });

  test("field wajib per jenis", () => {
    expect(
      issuesOf({
        ...VALID,
        rules: [
          rule({ type: "NO_DAY" }),
          rule({ type: "NO_DATE" }),
          rule({ type: "NO_WEEK" }),
          rule({ type: "NO_TIME" }),
        ],
      }),
    ).toEqual([
      "rules.0.dayOfWeek: Hari wajib dipilih",
      "rules.1.date: Tanggal wajib diisi",
      "rules.2.weekOfMonth: Pekan wajib dipilih",
      "rules.3.startTime: Jam mulai wajib diisi",
      "rules.3.endTime: Jam selesai wajib diisi",
    ]);
  });

  test("jam selesai harus lebih dari jam mulai", () => {
    expect(
      issuesOf({
        ...VALID,
        rules: [
          rule({ type: "NO_TIME", startTime: "09:00", endTime: "09:00" }),
        ],
      }),
    ).toEqual(["rules.0.endTime: Jam selesai harus lebih dari jam mulai"]);
  });

  test("aturan kembar ditolak di baris kedua", () => {
    expect(
      issuesOf({
        ...VALID,
        rules: [
          rule({ type: "NO_DAY", dayOfWeek: "0" }),
          rule({ type: "NO_DAY", dayOfWeek: "1" }),
          rule({ type: "NO_DAY", dayOfWeek: "0" }),
        ],
      }),
    ).toEqual(["rules.2.dayOfWeek: Sama dengan aturan 1; hapus salah satu."]);
  });
});

describe("toBapelPayload", () => {
  test("hanya field milik jenisnya yang dikirim, angka jadi number", () => {
    const payload = toBapelPayload({
      name: "  Komisi Pemuda ",
      rules: [
        rule({ type: "NO_DAY", dayOfWeek: "0", date: "2026-01-01" }),
        rule({ type: "NO_DATE", date: "2026-12-25", weekOfMonth: "2" }),
        rule({ type: "NO_WEEK", weekOfMonth: "-1" }),
        rule({ type: "NO_TIME", startTime: "07:00", endTime: "09:00" }),
      ],
    });

    expect(payload).toEqual({
      name: "Komisi Pemuda",
      rules: [
        { type: "NO_DAY", dayOfWeek: 0 },
        { type: "NO_DATE", date: "2026-12-25" },
        { type: "NO_WEEK", weekOfMonth: -1 },
        { type: "NO_TIME", startTime: "07:00", endTime: "09:00" },
      ],
    });
  });

  test("tanpa aturan tetap mengirim array kosong; kembar dibuang", () => {
    expect(toBapelPayload(VALID).rules).toEqual([]);
    expect(
      toBapelPayload({
        ...VALID,
        rules: [
          rule({ type: "NO_DAY", dayOfWeek: "3" }),
          rule({ type: "NO_DAY", dayOfWeek: "3", date: "2026-01-01" }),
        ],
      }).rules,
    ).toEqual([{ type: "NO_DAY", dayOfWeek: 3 }]);
  });
});

const RULES: BapelRule[] = [
  {
    id: 1,
    publicId: "a",
    type: "NO_DAY",
    dayOfWeek: 0,
    date: null,
    startTime: null,
    endTime: null,
    weekOfMonth: null,
  },
  {
    id: 2,
    publicId: "b",
    type: "NO_TIME",
    dayOfWeek: null,
    date: null,
    startTime: "07:00",
    endTime: "09:00",
    weekOfMonth: null,
  },
  {
    id: 3,
    publicId: "c",
    type: "NO_DATE",
    dayOfWeek: null,
    date: "2026-12-25T00:00:00.000Z",
    startTime: null,
    endTime: null,
    weekOfMonth: null,
  },
  {
    id: 4,
    publicId: "d",
    type: "NO_WEEK",
    dayOfWeek: null,
    date: null,
    startTime: null,
    endTime: null,
    weekOfMonth: -1,
  },
];

describe("toBapelForm", () => {
  test("detail be-sada menjadi nilai form string", () => {
    const detail: BapelDetail = {
      id: 1,
      publicId: "x",
      code: "BPL-0001",
      name: "Komisi Pemuda",
      rules: RULES,
    };

    expect(toBapelForm(detail)).toEqual({
      name: "Komisi Pemuda",
      rules: [
        rule({ type: "NO_DAY", dayOfWeek: "0" }),
        rule({ type: "NO_TIME", startTime: "07:00", endTime: "09:00" }),
        rule({ type: "NO_DATE", date: "2026-12-25" }),
        rule({ type: "NO_WEEK", weekOfMonth: "-1" }),
      ],
    });
  });
});

describe("summarizeRules", () => {
  test("ringkasan baris tabel", () => {
    expect(summarizeRules(RULES)).toBe(
      "Minggu, 07.00–09.00, 25 Desember 2026, Pekan terakhir",
    );
    expect(summarizeRules([])).toBe("");
  });
});

describe("serverFieldError", () => {
  test("nama ganda (404 be-sada) dipetakan ke field nama", () => {
    expect(serverFieldError("Bapel Sudah Tersedia")).toEqual({
      field: "name",
      message: "Nama ini sudah dipakai badan pelayanan lain.",
    });
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});
