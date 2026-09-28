import { describe, expect, test } from "bun:test";

import {
  EMPTY_REGISTRATION_FORM,
  cancelReasonOf,
  formOptionOf,
  formatEventTime,
  maskPhone,
  quotaTextOf,
  registrationFormSchema,
  serverFieldError,
  toRegistrationPayload,
  type RegistrationFormValues,
} from "./model";
import type { EventOption, RegistrationEvent } from "./types";

const errorsOf = (values: Partial<RegistrationFormValues>) => {
  const result = registrationFormSchema.safeParse({
    ...EMPTY_REGISTRATION_FORM,
    eventId: "2",
    ...values,
  });

  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [
      issue.path.join("."),
      issue.message,
    ]),
  );
};

const EVENT: EventOption = {
  id: 2,
  code: "EVN_0002-2026-0001",
  name: "Retret Pemuda",
  startDate: "2026-10-12T00:00:00.000Z",
  endDate: "2026-10-14T00:00:00.000Z",
  startTime: "07:00",
  endTime: "17:00",
  capacity: 40,
  registeredCount: 32,
  isPaid: true,
  price: "350000.00",
  isOpen: true,
};

const FREE: RegistrationEvent = {
  id: 3,
  code: "EVN_0005-2026-0001",
  name: "Latihan Paduan Suara",
  startDate: "2026-10-12T00:00:00.000Z",
  endDate: "2026-10-12T00:00:00.000Z",
  startTime: "18:30",
  endTime: null,
  isPaid: false,
  price: null,
};

describe("skema", () => {
  test("event dan jemaat wajib; jemaat tanpa nama/telepon lolos", () => {
    expect(errorsOf({ eventId: "" })).toMatchObject({
      eventId: "Pilih event",
      jemaatId: "Pilih jemaat",
    });
    expect(errorsOf({ jemaatId: "4" })).toEqual({});
  });

  test("jemaat: telepon diperiksa bila diminta server atau diketik", () => {
    expect(errorsOf({ jemaatId: "10", isPhoneAsked: true })).toEqual({
      participantPhone: "Isi nomor telepon, 6–15 digit",
    });
    expect(errorsOf({ jemaatId: "10", participantPhone: "0812" })).toEqual({
      participantPhone: "Isi nomor telepon, 6–15 digit",
    });
    expect(
      errorsOf({
        jemaatId: "10",
        isPhoneAsked: true,
        participantPhone: "+62 812-3456",
      }),
    ).toEqual({});
  });

  test("tamu: nama 3–150 dan telepon 6–15 wajib; email opsional tapi harus valid", () => {
    expect(errorsOf({ kind: "tamu" })).toEqual({
      participantName: "Isi nama peserta, minimal 3 karakter",
      participantPhone: "Isi nomor telepon, 6–15 digit",
    });
    expect(
      errorsOf({
        kind: "tamu",
        participantName: "A".repeat(151),
        participantPhone: "08121234abc",
      }),
    ).toEqual({
      participantName: "Nama peserta maksimal 150 karakter",
      participantPhone: "Isi nomor telepon, 6–15 digit",
    });
    expect(
      errorsOf({
        kind: "tamu",
        participantName: "Ruth Pardede",
        participantPhone: "082166554433",
        participantEmail: "ruth@",
      }),
    ).toEqual({
      participantEmail:
        "Isi email dengan format yang benar, mis. nama@contoh.com",
    });
    expect(
      errorsOf({
        kind: "tamu",
        participantName: "Ruth Pardede",
        participantPhone: "082166554433",
      }),
    ).toEqual({});
  });
});

describe("payload", () => {
  test("jemaat tanpa nama/telepon; telepon ikut bila diketik; email hanya event berbayar", () => {
    const values: RegistrationFormValues = {
      ...EMPTY_REGISTRATION_FORM,
      eventId: "2",
      jemaatId: "4",
      participantEmail: "debora@example.com",
    };

    expect(toRegistrationPayload(values, false)).toEqual({
      eventId: 2,
      jemaatId: 4,
    });
    expect(toRegistrationPayload(values, true)).toEqual({
      eventId: 2,
      jemaatId: 4,
      participantEmail: "debora@example.com",
    });
    expect(
      toRegistrationPayload(
        { ...values, participantPhone: " 081299 ", isPhoneAsked: true },
        false,
      ),
    ).toEqual({ eventId: 2, jemaatId: 4, participantPhone: "081299" });
  });

  test("tamu: jemaatId null, isian di-trim, email kosong = null", () => {
    expect(
      toRegistrationPayload(
        {
          ...EMPTY_REGISTRATION_FORM,
          eventId: "3",
          kind: "tamu",
          participantName: " Ruth Pardede ",
          participantPhone: "082166554433",
        },
        false,
      ),
    ).toEqual({
      eventId: 3,
      jemaatId: null,
      participantName: "Ruth Pardede",
      participantPhone: "082166554433",
      participantEmail: null,
    });
  });
});

describe("tampilan", () => {
  test("maskPhone: 4 awal + 4 akhir, pendek 2 akhir, samaran be-sada dipertahankan", () => {
    expect(maskPhone("081210000003")).toBe("0812••••0003");
    expect(maskPhone("0812345")).toBe("••••45");
    expect(maskPhone("0812****7890")).toBe("0812••••7890");
  });

  test("opsi event: sisa kursi, harga, penuh dinonaktifkan", () => {
    expect(formOptionOf(EVENT)).toMatchObject({
      label: "Retret Pemuda",
      hint: "12 Okt 2026 · sisa 8 kursi · Rp 350.000",
      isDisabled: false,
    });
    expect(
      formOptionOf({ ...EVENT, registeredCount: 41, isPaid: false }),
    ).toMatchObject({ hint: "12 Okt 2026 · Penuh", isDisabled: true });
  });

  test("ringkasan kuota memakai hitungan asli; lebih dari kapasitas = Penuh", () => {
    expect(quotaTextOf(EVENT)).toBe(
      "32 dari 40 kursi terisi · Rp 350.000 per peserta",
    );
    expect(quotaTextOf({ ...EVENT, registeredCount: 41 })).toBe(
      "41 dari 40 kursi terisi · Penuh · Rp 350.000 per peserta",
    );
  });

  test("waktu event satu hari vs rentang; jam kosong = tanggal saja", () => {
    expect(formatEventTime(FREE)).toBe("12 Oktober 2026, 18:30");
    expect(formatEventTime(EVENT)).toBe(
      "12 Okt 2026 – 14 Okt 2026, 07:00–17:00",
    );
    expect(formatEventTime({ ...FREE, startTime: null })).toBe(
      "12 Oktober 2026",
    );
  });

  test("alasan tidak bisa dibatalkan", () => {
    const paid = { ...FREE, isPaid: true };
    const payment = (status: "PENDING" | "PAID" | "EXPIRED") => ({
      code: "PAY-2026-0001",
      status,
      amount: "350000",
      invoiceUrl: null,
      expiredAt: null,
    });
    const REFUND = "Pengembalian dana ditangani di luar sistem.";

    expect(
      cancelReasonOf({ status: "CONFIRMED", event: FREE, payment: null }),
    ).toBeNull();
    expect(
      cancelReasonOf({
        status: "CONFIRMED",
        event: paid,
        payment: payment("PAID"),
      }),
    ).toBe(REFUND);
    expect(
      cancelReasonOf({
        status: "PENDING_PAYMENT",
        event: paid,
        payment: payment("PENDING"),
      }),
    ).toBe(
      "Menunggu pembayaran. Kursi kembali sendiri bila tagihan kedaluwarsa.",
    );
    expect(
      cancelReasonOf({
        status: "EXPIRED",
        event: paid,
        payment: payment("EXPIRED"),
      }),
    ).toBe("Pendaftaran ini sudah tidak aktif.");
    expect(
      cancelReasonOf({
        status: "EXPIRED",
        event: paid,
        payment: payment("PAID"),
      }),
    ).toBe(REFUND);
  });

  test("pesan server ke field", () => {
    expect(serverFieldError("Event Ini Sudah Berlangsung")?.field).toBe(
      "eventId",
    );
    expect(
      serverFieldError("Jemaat ini sudah terdaftar pada event tersebut")?.field,
    ).toBe("jemaatId");
    expect(serverFieldError("Kuota Event Ini Sudah Penuh (3 peserta)")).toBe(
      null,
    );
  });
});
