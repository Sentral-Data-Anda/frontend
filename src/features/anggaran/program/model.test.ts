import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { todayJakarta } from "@/lib/date";
import type { CeilingUsage } from "@/types/anggaran";

import {
  cancelledTitleOf,
  ceilingExceededMessage,
  emptyProgramForm,
  errorFixOf,
  formTotal,
  isCeilingExceeded,
  isCeilingMissing,
  pendingStepText,
  programFormSchema,
  programStateLabel,
  programStateOf,
  rejectedMessageOf,
  rejectedStepOf,
  rejectedTitleOf,
  remainingBeforeOf,
  toProgramPayload,
  toProgramQuery,
  yearSelectOptions,
} from "./model";
import type { ProgramApproval } from "./types";

const TARGET = { bapelId: 2, year: 2026 };

const usage = (next: Partial<CeilingUsage> = {}): CeilingUsage => ({
  year: 2026,
  ceiling: "45000000",
  committed: "45000000",
  remaining: "0",
  isWithinCeiling: true,
  disbursed: "9000000",
  reported: "4000000",
  untagged: "0",
  ...next,
});

const approval = (next: Partial<ProgramApproval> = {}): ProgramApproval => ({
  publicId: "apr-1",
  code: "APR-2026-0001",
  status: "PENDING",
  currentOrder: 2,
  amount: "9000000",
  isSubmittedByViewer: true,
  steps: [
    {
      order: 1,
      approverRoleName: "Ketua Majelis Jemaat",
      status: "APPROVED",
      note: null,
      actedAt: null,
      actor: { name: "Pnt. Hotman Sinaga" },
    },
    {
      order: 2,
      approverRoleName: "Sekretaris Majelis Jemaat",
      status: "PENDING",
      note: null,
      actedAt: null,
      actor: null,
    },
    {
      order: 3,
      approverRoleName: "Bendahara Majelis Jemaat",
      status: "PENDING",
      note: null,
      actedAt: null,
      actor: null,
    },
  ],
  ...next,
});

const values = (next: Partial<ReturnType<typeof emptyProgramForm>> = {}) => ({
  ...emptyProgramForm("2026"),
  name: "Retret Pemuda",
  bapelId: "2",
  items: [
    {
      accountId: "23",
      description: "Sewa aula",
      quantity: "2",
      unitPrice: "1500000",
      note: "",
    },
  ],
  ...next,
});

const messagesOf = (input: ReturnType<typeof values>) => {
  const parsed = programFormSchema.safeParse(input);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}:${issue.message}`,
      );
};

describe("skema program", () => {
  test("nama, komisi, dan tahun wajib", () => {
    const messages = messagesOf(values({ name: " ", bapelId: "", year: "" }));

    expect(messages).toContain("name:Isi nama program");
    expect(messages).toContain("bapelId:Pilih badan pelayanan");
    expect(messages).toContain("year:Pilih tahun pelayanan");
  });

  test("rincian minimal satu baris", () => {
    expect(messagesOf(values({ items: [] }))).toContain(
      "items:Program harus memiliki minimal 1 rincian anggaran",
    );
  });

  test("form dibuka dengan satu baris kosong, bukan nol", () => {
    expect(emptyProgramForm("2026").items).toHaveLength(1);
  });

  test("tanggal selesai tidak boleh sebelum tanggal mulai", () => {
    const messages = messagesOf(
      values({ startDate: "2026-08-10", endDate: "2026-08-01" }),
    );

    expect(messages).toContain(
      "endDate:Tanggal selesai tidak boleh sebelum tanggal mulai",
    );
  });

  test("tanggal di masa depan diterima — ini rencana, bukan transaksi", () => {
    const today = todayJakarta();
    const messages = messagesOf(
      values({
        startDate: today,
        endDate: `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`,
      }),
    );

    expect(messages).toHaveLength(0);
  });

  test("nominal baris harus lebih dari 0 dan maksimal 2 desimal", () => {
    const zero = messagesOf(
      values({
        items: [
          {
            accountId: "23",
            description: "Sewa",
            quantity: "0",
            unitPrice: "1000.123",
            note: "",
          },
        ],
      }),
    );

    expect(zero).toContain("items.0.quantity:Jumlah harus lebih dari 0");
    expect(zero).toContain(
      "items.0.unitPrice:Harga satuan maksimal 2 angka di belakang koma",
    );
  });
});

describe("payload program", () => {
  test("tanpa proposedAmount, tanpa amount per baris, tanpa status", () => {
    const payload = toProgramPayload(values());
    const keys = Object.keys(payload);

    expect(keys).not.toContain("proposedAmount");
    expect(keys).not.toContain("status");
    expect(keys).not.toContain("budgetAmount");
    expect(Object.keys(payload.items[0]!)).not.toContain("amount");
  });

  test("isUnplanned ikut sebagai boolean, dan tanggal kosong jadi null", () => {
    const payload = toProgramPayload(values({ isUnplanned: "1" }));

    expect(payload.isUnplanned).toBe(true);
    expect(payload.startDate).toBeNull();
    expect(payload.endDate).toBeNull();
  });

  test("total dihitung dari baris, bukan dikirim", () => {
    expect(formTotal(values().items)).toBe("3000000");
  });
});

describe("aritmetika pagu", () => {
  test("tepat di pagu diterima — batas inklusif", () => {
    expect(isCeilingExceeded(usage())).toBe(false);
    expect(isCeilingMissing(usage())).toBe(false);
  });

  test("satu rupiah di atas pagu ditolak", () => {
    const over = usage({
      committed: "45000001",
      remaining: "-1",
      isWithinCeiling: false,
    });

    expect(isCeilingExceeded(over)).toBe(true);
    expect(remainingBeforeOf(over, "3000001")).toBe("3000000");
    expect(ceilingExceededMessage(remainingBeforeOf(over, "3000001"))).toBe(
      "Usulan ini melebihi sisa pagu Rp 3.000.000.",
    );
  });

  test("pagu yang tidak ada adalah penolakan, bukan tanpa batas", () => {
    const missing = usage({
      ceiling: null,
      remaining: null,
      isWithinCeiling: false,
    });

    expect(isCeilingMissing(missing)).toBe(true);
    expect(isCeilingExceeded(missing)).toBe(false);
  });
});

describe("status dan persetujuan", () => {
  test("Menunggu persetujuan diturunkan dari approval, bukan dari status", () => {
    const program = { status: "DRAFT" as const, approval: approval() };

    expect(programStateOf(program)).toBe("PENDING_APPROVAL");
    expect(programStateLabel(program)).toBe("Menunggu persetujuan (2 dari 3)");
    expect(pendingStepText(approval())).toBe("Menunggu persetujuan (2 dari 3)");
  });

  test("Draf tanpa permintaan terbuka tetap Draf", () => {
    expect(programStateOf({ status: "DRAFT", approval: null })).toBe("DRAFT");
    expect(
      programStateOf({
        status: "DRAFT",
        approval: approval({ status: "CANCELLED" }),
      }),
    ).toBe("DRAFT");
  });

  test("penolakan dibaca dari langkah yang menolak, dengan nama dan jabatan", () => {
    const rejected = approval({
      status: "REJECTED",
      steps: [
        {
          order: 1,
          approverRoleName: "Ketua Majelis Jemaat",
          status: "REJECTED",
          note: "Nominal konsumsi terlalu tinggi.",
          actedAt: "2026-10-01T02:00:00.000Z",
          actor: { name: "Pnt. Hotman Sinaga" },
        },
      ],
    });
    const step = rejectedStepOf(rejected);

    expect(step).not.toBeNull();
    expect(rejectedTitleOf(step!)).toContain("Pnt. Hotman Sinaga");
    expect(rejectedTitleOf(step!)).toContain("Ketua Majelis Jemaat");
    expect(rejectedMessageOf(step!)).toBe(
      "Nominal konsumsi terlalu tinggi. Perbaiki lalu ajukan lagi.",
    );
  });

  test("tanpa penolakan tidak ada langkah penolakan", () => {
    expect(rejectedStepOf(approval())).toBeNull();
    expect(rejectedStepOf(null)).toBeNull();
  });

  test("pembatalan menyebut pembatalnya", () => {
    expect(
      cancelledTitleOf({
        cancelledBy: { name: "Daniel Panjaitan" },
        cancelledAt: "2026-10-01T02:00:00.000Z",
      }),
    ).toContain("Daniel Panjaitan");
  });
});

describe("peta code ke perbaikan", () => {
  test("code dikenal memberi tautan perbaikan", () => {
    expect(
      errorFixOf(new FetchError(400, "apa saja", [], "CEILING_MISSING"), TARGET)
        ?.href,
    ).toBe("/anggaran/pagu-anggaran?komisi=2&tahun=2026");
    expect(
      errorFixOf(new FetchError(400, "apa saja", [], "NO_WORKFLOW"), TARGET)
        ?.href,
    ).toBe("/persetujuan/setelan-persetujuan");
  });

  test("pesan yang memuat kata kuncinya tanpa code tidak memicu tautan", () => {
    expect(
      errorFixOf(
        new FetchError(400, "Belum Ada Alur Persetujuan Untuk Pagu Ini"),
        TARGET,
      ),
    ).toBeNull();
    expect(
      errorFixOf(new FetchError(400, "Pagu anggaran komisi belum ada"), TARGET),
    ).toBeNull();
  });

  test("code yang tidak dikenal dirender tanpa tautan", () => {
    expect(
      errorFixOf(new FetchError(400, "apa saja", [], "SESUATU_BARU"), TARGET),
    ).toBeNull();
  });

  test("UNDER_APPROVAL tidak punya tautan — perbaikannya tombol Tarik", () => {
    expect(
      errorFixOf(new FetchError(400, "apa saja", [], "UNDER_APPROVAL"), TARGET),
    ).toBeNull();
  });
});

describe("daftar", () => {
  test("tab Menunggu menyaring Draf berpermintaan terbuka", () => {
    expect(toProgramQuery("PENDING_APPROVAL", {}, "2026")).toEqual({
      status: "DRAFT",
      apiFilters: { year: "2026", bapelId: "", isPendingApproval: "1" },
    });
  });

  test("tab Draf menyaring Draf tanpa permintaan terbuka", () => {
    expect(
      toProgramQuery("DRAFT", {}, "2026").apiFilters.isPendingApproval,
    ).toBe("0");
  });

  test("tab Semua tidak mengirim status maupun saringan permintaan", () => {
    expect(toProgramQuery("", { komisi: "2" }, "2026")).toEqual({
      status: "",
      apiFilters: { year: "2026", bapelId: "2", isPendingApproval: "" },
    });
  });

  test("ACTIVE dan COMPLETED tidak punya tab", () => {
    expect(toProgramQuery("ACTIVE", {}, "2026").status).toBe("");
    expect(toProgramQuery("COMPLETED", {}, "2026").status).toBe("");
  });

  test("label tahun dipakai apa adanya dari server", () => {
    const options = yearSelectOptions([
      { year: 2026, label: "2026/2027 (Juli 2026 – Juni 2027)" },
    ]);

    expect(options).toEqual([
      { value: "2026", label: "2026/2027 (Juli 2026 – Juni 2027)" },
    ]);
  });
});
