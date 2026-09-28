import { describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "@/lib/date";

import {
  CYCLE_LIST_PATH,
  EMPTY_MAINTENANCE_FORM,
  disposalFormSchema,
  emptyDisposalForm,
  emptyTransferForm,
  isWorkflowMissing,
  kindReturnHref,
  maintenanceFormSchema,
  serverFieldError,
  toCycleApiFilters,
  toDisposalPayload,
  toMaintenanceForm,
  toMaintenancePayload,
  toTransferPayload,
  transferFormSchema,
} from "./model";
import type { Maintenance } from "./types";

const TODAY = todayJakarta();
const TOMORROW = addDays(TODAY, 1);
const YESTERDAY = addDays(TODAY, -1);

const messagesOf = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) =>
  Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [
      issue.path.join("."),
      issue.message,
    ]),
  );

const maintenance = {
  ...EMPTY_MAINTENANCE_FORM,
  assetId: "1",
  scheduledDate: YESTERDAY,
  description: "Cuci AC",
};

describe("skema perawatan", () => {
  test("tanggal selesai wajib hanya bila Selesai, ≥ rencana, ≤ hari ini", () => {
    expect(maintenanceFormSchema.safeParse(maintenance).success).toBe(true);
    expect(
      messagesOf(
        maintenanceFormSchema.safeParse({ ...maintenance, status: "DONE" }),
      ).completedDate,
    ).toBe("Tanggal selesai wajib diisi untuk perawatan selesai");
    expect(
      messagesOf(
        maintenanceFormSchema.safeParse({
          ...maintenance,
          status: "DONE",
          completedDate: addDays(TODAY, -2),
        }),
      ).completedDate,
    ).toBe("Tanggal selesai tidak boleh sebelum tanggal rencana");
    expect(
      messagesOf(
        maintenanceFormSchema.safeParse({
          ...maintenance,
          status: "DONE",
          completedDate: TOMORROW,
        }),
      ).completedDate,
    ).toBe("Tanggal selesai tidak boleh di masa depan");
    expect(
      maintenanceFormSchema.safeParse({
        ...maintenance,
        scheduledDate: TOMORROW,
      }).success,
    ).toBe(true);
  });

  test("biaya ≥ 1 bila diisi; keterangan wajib dan ≤ 250", () => {
    const errors = messagesOf(
      maintenanceFormSchema.safeParse({
        ...maintenance,
        cost: "0",
        description: " ",
      }),
    );

    expect(errors.cost).toBe("Biaya harus lebih dari 0");
    expect(errors.description).toBe("Keterangan wajib diisi");
    expect(
      messagesOf(
        maintenanceFormSchema.safeParse({
          ...maintenance,
          description: "x".repeat(251),
        }),
      ).description,
    ).toBe("Keterangan maksimal 250 karakter");
  });

  test("payload: completedDate hanya bila Selesai, opsional kosong tidak dikirim", () => {
    expect(
      toMaintenancePayload({ ...maintenance, completedDate: YESTERDAY }),
    ).toEqual({
      assetId: 1,
      status: "SCHEDULED",
      scheduledDate: YESTERDAY,
      completedDate: undefined,
      description: "Cuci AC",
      cost: undefined,
      supplierId: undefined,
      performedBy: undefined,
    });
    expect(
      toMaintenancePayload({
        ...maintenance,
        status: "DONE",
        completedDate: YESTERDAY,
        cost: "450000",
        supplierId: "3",
        performedBy: " Pak Yohanes ",
      }),
    ).toMatchObject({
      completedDate: YESTERDAY,
      cost: 450000,
      supplierId: 3,
      performedBy: "Pak Yohanes",
    });
  });

  test("baris → form: uang desimal jadi digit, tanggal ISO jadi YYYY-MM-DD", () => {
    const row: Maintenance = {
      id: 3,
      publicId: "p",
      code: "SKA-2026-0003",
      assetId: 8,
      status: "DONE",
      scheduledDate: "2026-09-01T00:00:00.000Z",
      completedDate: "2026-09-03T00:00:00.000Z",
      description: "Cuci AC",
      cost: "450000.00",
      supplierId: null,
      performedBy: null,
      asset: { publicId: "a", code: "AST", name: "AC" },
      supplier: null,
    };

    expect(toMaintenanceForm(row)).toEqual({
      assetId: "8",
      status: "DONE",
      scheduledDate: "2026-09-01",
      completedDate: "2026-09-03",
      description: "Cuci AC",
      cost: "450000",
      supplierId: "",
      performedBy: "",
    });
  });
});

describe("skema pindah lokasi", () => {
  const transfer = {
    ...emptyTransferForm(),
    assetId: "1",
    fromRoomId: "1",
    fromBapelId: "1",
    toRoomId: "1",
    toBapelId: "1",
  };

  test("tujuan harus berbeda dari lokasi sekarang; badan pelayanan saja boleh", () => {
    expect(messagesOf(transferFormSchema.safeParse(transfer)).toRoomId).toBe(
      "Pilih ruang atau badan pelayanan yang berbeda dari lokasi sekarang",
    );
    expect(
      transferFormSchema.safeParse({ ...transfer, toBapelId: "5" }).success,
    ).toBe(true);
  });

  test("tanggal bawaan hari ini dan tidak boleh di masa depan", () => {
    expect(transfer.transferDate).toBe(TODAY);
    expect(
      messagesOf(
        transferFormSchema.safeParse({
          ...transfer,
          toRoomId: "2",
          transferDate: TOMORROW,
        }),
      ).transferDate,
    ).toBe("Tanggal pindah tidak boleh di masa depan");
  });

  test("payload tanpa lokasi asal; alasan kosong tidak dikirim", () => {
    expect(toTransferPayload({ ...transfer, toRoomId: "2" })).toEqual({
      assetId: 1,
      toRoomId: 2,
      toBapelId: 1,
      transferDate: TODAY,
      reason: undefined,
    });
  });
});

describe("skema pelepasan", () => {
  const disposal = {
    ...emptyDisposalForm(),
    assetId: "1",
    method: "SCRAPPED" as const,
    reason: "Rusak berat",
  };

  test("cara dan alasan wajib; hasil wajib hanya bila Dijual", () => {
    const errors = messagesOf(
      disposalFormSchema.safeParse({ ...disposal, method: "", reason: "" }),
    );

    expect(errors.method).toBe("Pilih cara pelepasan");
    expect(errors.reason).toBe("Alasan wajib diisi");
    expect(disposalFormSchema.safeParse(disposal).success).toBe(true);
    expect(
      messagesOf(disposalFormSchema.safeParse({ ...disposal, method: "SOLD" }))
        .proceeds,
    ).toBe("Hasil penjualan wajib diisi untuk barang yang dijual");
    expect(
      messagesOf(
        disposalFormSchema.safeParse({ ...disposal, disposalDate: TOMORROW }),
      ).disposalDate,
    ).toBe("Tanggal pelepasan tidak boleh di masa depan");
  });

  test("payload: proceeds hanya bila Dijual", () => {
    expect(toDisposalPayload({ ...disposal, proceeds: "5000" })).toEqual({
      assetId: 1,
      method: "SCRAPPED",
      disposalDate: TODAY,
      reason: "Rusak berat",
      proceeds: undefined,
    });
    expect(
      toDisposalPayload({ ...disposal, method: "SOLD", proceeds: "5000" })
        .proceeds,
    ).toBe(5000);
  });
});

describe("daftar dan galat", () => {
  test("filter → query be-sada", () => {
    expect(toCycleApiFilters({ bulan: "2026-02", cara: "SOLD" })).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      method: "SOLD",
    });
    expect(toCycleApiFilters({})).toEqual({
      startDate: "",
      endDate: "",
      method: "",
    });
  });

  test("kembali ke tab jenisnya", () => {
    const saved = `${CYCLE_LIST_PATH}?jenis=pindah&bulan=2026-09`;

    expect(kindReturnHref(saved, "pindah")).toBe(saved);
    expect(kindReturnHref(saved, "perawatan")).toBe(CYCLE_LIST_PATH);
    expect(kindReturnHref(CYCLE_LIST_PATH, "pelepasan")).toBe(
      `${CYCLE_LIST_PATH}?jenis=pelepasan`,
    );
  });

  test("pesan server tanpa issues → field", () => {
    expect(
      serverFieldError("Barang Ini Sudah Berada Di Ruangan Dan Komisi Tersebut")
        ?.field,
    ).toBe("toRoomId");
    expect(
      serverFieldError("Barang Ini Sudah Dilepas Dan Tidak Dapat Diproses Lagi")
        ?.field,
    ).toBe("assetId");
    expect(serverFieldError("Internal Server Error")).toBeNull();
    expect(
      isWorkflowMissing(
        "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
      ),
    ).toBe(true);
  });
});
