import { describe, expect, test } from "bun:test";

import type { AttachmentValue } from "@/types/attachment";

import {
  EMPTY_EVENT_FORM,
  eventFormSchema,
  eventStatusOf,
  formatEventDates,
  formatEventWhen,
  monthRange,
  priceLabel,
  toEventApiFilters,
  toEventForm,
  toEventFormData,
  type EventFormValues,
} from "./model";
import type { ChurchEvent } from "./types";

const file = new File(["x"], "poster.jpg", { type: "image/jpeg" });

const NEW_IMAGE: AttachmentValue = {
  key: "k",
  name: "poster.jpg",
  mimeType: "image/jpeg",
  url: "blob:x",
  showOnWebsite: false,
  file,
};

const OLD_IMAGE: AttachmentValue = {
  ...NEW_IMAGE,
  file: null,
  url: "http://m",
};

const VALID: EventFormValues = {
  ...EMPTY_EVENT_FORM,
  name: "Retret Pemuda",
  description: "Retret tahunan komisi pemuda.",
  bapelId: "2",
  image: [NEW_IMAGE],
  startDate: "2026-10-12",
  endDate: "2026-10-12",
  startTime: "09:00",
  roomId: "1",
  capacity: "40",
};

const CREATE = { isEdit: false, registeredCount: 0 };

const errorsOf = (
  values: EventFormValues,
  context: { isEdit: boolean; registeredCount: number } = CREATE,
) =>
  Object.fromEntries(
    (eventFormSchema(context).safeParse(values).error?.issues ?? []).map(
      (issue) => [issue.path.join("."), issue.message],
    ),
  );

describe("skema event", () => {
  test("isian lengkap lolos", () => {
    expect(errorsOf(VALID)).toEqual({});
  });

  test("wajib dan batas panjang", () => {
    expect(
      errorsOf({ ...VALID, name: " ab ", description: "pendek", bapelId: "" }),
    ).toMatchObject({
      name: "Isi nama event, minimal 4 karakter",
      description: "Isi deskripsi, minimal 10 karakter",
      bapelId: "Pilih badan pelayanan",
    });
    expect(errorsOf({ ...VALID, name: "a".repeat(151) }).name).toBe(
      "Nama event maksimal 150 karakter",
    );
    expect(errorsOf({ ...VALID, startTime: "" }).startTime).toBe(
      "Isi jam mulai",
    );
  });

  test("foto utama wajib hanya saat tambah", () => {
    expect(errorsOf({ ...VALID, image: [] }).image).toBe(
      "Pilih foto utama event",
    );
    expect(
      errorsOf({ ...VALID, image: [] }, { isEdit: true, registeredCount: 0 }),
    ).toEqual({});
  });

  test("ruang atau lokasi sesuai tempat", () => {
    expect(errorsOf({ ...VALID, roomId: "" }).roomId).toBe("Pilih ruang");
    expect(
      errorsOf({ ...VALID, isIndoor: "0", roomId: "", location: "abc" })
        .location,
    ).toBe("Isi lokasi, minimal 4 karakter");
    expect(
      errorsOf({ ...VALID, isIndoor: "0", location: "a".repeat(101) }).location,
    ).toBe("Lokasi maksimal 100 karakter");
    expect(
      errorsOf({ ...VALID, isIndoor: "0", roomId: "", location: "Parapat" }),
    ).toEqual({});
  });

  test("tanggal selesai tidak sebelum mulai; satu hari boleh", () => {
    expect(errorsOf({ ...VALID, endDate: "2026-10-11" }).endDate).toBe(
      "Tanggal selesai tidak boleh sebelum tanggal mulai",
    );
    expect(errorsOf({ ...VALID, endDate: "2026-10-12" })).toEqual({});
  });

  test("jam selesai setelah jam mulai hanya di hari yang sama", () => {
    expect(errorsOf({ ...VALID, endTime: "09:00" }).endTime).toBe(
      "Jam selesai harus setelah jam mulai",
    );
    expect(
      errorsOf({ ...VALID, endDate: "2026-10-14", endTime: "08:00" }),
    ).toEqual({});
  });

  test("kapasitas minimal 1 dan tidak di bawah pendaftar", () => {
    expect(errorsOf({ ...VALID, capacity: "0" }).capacity).toBe(
      "Kapasitas minimal 1 orang",
    );
    expect(
      errorsOf(
        { ...VALID, capacity: "2" },
        { isEdit: true, registeredCount: 3 },
      ).capacity,
    ).toBe("Kapasitas minimal 3, sudah ada 3 pendaftar.");
    expect(
      errorsOf(
        { ...VALID, capacity: "3" },
        { isEdit: true, registeredCount: 3 },
      ),
    ).toEqual({});
  });

  test("harga wajib ≥ 1 hanya bila berbayar", () => {
    expect(errorsOf({ ...VALID, isPaid: "1", price: "" }).price).toBe(
      "Isi harga, minimal Rp1",
    );
    expect(errorsOf({ ...VALID, isPaid: "1", price: "1" })).toEqual({});
    expect(errorsOf({ ...VALID, isPaid: "0", price: "" })).toEqual({});
  });
});

describe("payload multipart", () => {
  test("boolean 1/0, ruang saja, tanpa harga bila gratis, foto baru", () => {
    const body = toEventFormData(VALID);

    expect(body.get("isIndoor")).toBe("1");
    expect(body.get("isPaid")).toBe("0");
    expect(body.get("isPublish")).toBe("0");
    expect(body.get("roomId")).toBe("1");
    expect(body.has("location")).toBe(false);
    expect(body.has("price")).toBe(false);
    expect(body.has("endTime")).toBe(false);
    expect(body.get("mainImage")).toBeInstanceOf(File);
    expect(body.has("showOnWebsite")).toBe(false);
  });

  test("di luar gereja berbayar: lokasi + harga, tanpa ruang; foto lama tidak dikirim", () => {
    const body = toEventFormData({
      ...VALID,
      isIndoor: "0",
      location: " Parapat ",
      isPaid: "1",
      price: "350000",
      isPublish: "1",
      image: [OLD_IMAGE],
    });

    expect(body.get("location")).toBe("Parapat");
    expect(body.has("roomId")).toBe(false);
    expect(body.get("price")).toBe("350000");
    expect(body.get("isPaid")).toBe("1");
    expect(body.get("isPublish")).toBe("1");
    expect(body.has("mainImage")).toBe(false);
  });
});

const EVENT: ChurchEvent = {
  id: 2,
  code: "EVN_0002-2026-0001",
  name: "Retret Pemuda",
  description: "Retret tahunan komisi pemuda.",
  isIndoor: false,
  location: "Parapat, Danau Toba",
  capacity: 40,
  isPaid: true,
  price: "350000.00",
  startDate: "2026-10-12T00:00:00.000Z",
  endDate: "2026-10-14T00:00:00.000Z",
  startTime: "07:00",
  endTime: "17:00",
  urlForm: null,
  isPublish: true,
  bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" },
  room: null,
  image: null,
  registeredCount: 3,
};

describe("tampilan", () => {
  test("rentang tanggal dan jam", () => {
    expect(formatEventWhen(EVENT)).toBe("12–14 Okt 2026, 07.00");
    expect(
      formatEventWhen({
        ...EVENT,
        endDate: EVENT.startDate,
        startTime: "19:00",
        endTime: "21:00",
      }),
    ).toBe("12 Okt 2026, 19.00–21.00");
    expect(formatEventWhen({ ...EVENT, startTime: null })).toBe(
      "12–14 Okt 2026",
    );
    expect(formatEventDates("2026-09-30", "2026-10-02")).toBe(
      "30 Sep – 2 Okt 2026",
    );
    expect(formatEventDates("2026-12-30", "2027-01-02")).toBe(
      "30 Des 2026 – 2 Jan 2027",
    );
  });

  test("harga", () => {
    expect(priceLabel(EVENT)).toBe("Rp 350.000");
    expect(priceLabel({ isPaid: false, price: null })).toBe("Gratis");
  });

  test("status baris di batas tanggal", () => {
    const today = "2026-10-12";

    expect(eventStatusOf({ ...EVENT, isPublish: false }, today)).toBe("DRAFT");
    expect(eventStatusOf(EVENT, "2026-10-11")).toBe("UPCOMING");
    expect(eventStatusOf(EVENT, today)).toBe("ONGOING");
    expect(eventStatusOf(EVENT, "2026-10-14")).toBe("ONGOING");
    expect(eventStatusOf(EVENT, "2026-10-15")).toBe("DONE");
  });

  test("form ubah dari baris server", () => {
    expect(toEventForm(EVENT)).toMatchObject({
      isIndoor: "0",
      isPaid: "1",
      price: "350000",
      startDate: "2026-10-12",
      endDate: "2026-10-14",
      roomId: "",
      image: [],
    });
  });
});

describe("filter daftar", () => {
  test("bulan → rentang, status → isPublish, terbaru dulu", () => {
    expect(monthRange("2026-02")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
    expect(toEventApiFilters({ bulan: "2026-10", bapel: "3" }, "draf")).toEqual(
      {
        bapelId: "3",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        isPublish: "0",
        order: "desc",
      },
    );
    expect(toEventApiFilters({}, "terbit").isPublish).toBe("1");
    expect(toEventApiFilters({}, "").startDate).toBe("");
  });
});
