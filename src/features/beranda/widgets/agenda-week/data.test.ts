import { describe, expect, test } from "bun:test";

import type { EventItem, IbadahWeekItem } from "../../api";

import { buildAgenda } from "./data";

const ITEM: IbadahWeekItem = {
  code: "IBD_0001-2026-0001",
  date: "2026-09-27T00:00:00.000Z",
  startTime: "08:00",
  preacher: null,
  typeIbadah: { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I" },
  placeType: "GEREJA",
  room: { name: "Gedung Gereja" },
  hostKeluarga: null,
  placeName: null,
};

describe("agenda pekan", () => {
  test("tempat ibadah dari label bersama: ruang, rumah tuan rumah, lainnya", () => {
    const rows = buildAgenda(
      [
        ITEM,
        {
          ...ITEM,
          code: "IBD_0006-2026-0001",
          date: "2026-10-01T00:00:00.000Z",
          startTime: "19:00",
          placeType: "RUMAH_JEMAAT",
          room: null,
          hostKeluarga: { name: "Keluarga Sitanggang" },
        },
        {
          ...ITEM,
          code: "IBD_0004-2026-0001",
          date: "2026-10-02T00:00:00.000Z",
          placeType: "LAINNYA",
          room: null,
          placeName: "Villa Ciater",
        },
      ],
      [],
      [],
    );

    expect(rows.map((row) => row.room)).toEqual([
      "Gedung Gereja",
      "Rumah Keluarga Sitanggang",
      "Villa Ciater",
    ]);
  });

  test("event: jam mulai di hari pertama, sepanjang hari bila berlanjut atau jam kosong", () => {
    const event: EventItem = {
      code: "EVN_0001-2026-0001",
      name: "Retret Pemuda",
      startDate: "2026-09-28T00:00:00.000Z",
      endDate: "2026-09-30T00:00:00.000Z",
      startTime: "07:00",
      location: "Parapat",
      room: null,
      bapel: { name: "Komisi Pemuda" },
    };

    const time = (days: string[], item: EventItem) =>
      buildAgenda([], [item], days)[0]?.time;

    expect(time(["2026-09-28", "2026-09-29"], event)).toBe("07:00");
    expect(time(["2026-09-29", "2026-09-30"], event)).toBeNull();
    expect(time(["2026-09-28"], { ...event, startTime: null })).toBeNull();
  });
});
