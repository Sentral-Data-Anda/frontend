import { expect, test } from "bun:test";

import {
  sortByStartTime,
  toZoneBars,
  type IbadahListItem,
  type ZoneCount,
} from "./api";

const row = (code: string, startTime: string): IbadahListItem => ({
  code,
  startTime,
  preacher: null,
  typeIbadah: { id: 1, code: "TI-1", name: "Ibadah Minggu" },
});

test("urutan be-sada (jam menurun) dibalik ke jam naik", () => {
  const fromApi = [row("C", "17:00"), row("B", "10:00"), row("A", "07:30")];

  expect(sortByStartTime(fromApi).map((item) => item.code)).toEqual([
    "A",
    "B",
    "C",
  ]);
  expect(fromApi[0].code).toBe("C");
});

const zone = (
  zoneChurchId: number | null,
  anggota: number,
  simpatisan: number,
  isActive: boolean | null = zoneChurchId === null ? null : true,
): ZoneCount => ({
  zoneChurchId,
  name: zoneChurchId === null ? null : `Wilayah ${zoneChurchId}`,
  isActive,
  anggota,
  simpatisan,
});

test("wilayah: nilai = anggota + simpatisan, nol aktif tetap tampil", () => {
  expect(toZoneBars([zone(1, 120, 14), zone(2, 0, 0)])).toEqual([
    { key: "1", label: "Wilayah 1", count: 134, isOptional: false },
    { key: "2", label: "Wilayah 2", count: 0, isOptional: false },
  ]);
});

test("wilayah: tanpa wilayah dan nonaktif disembunyikan bila nol", () => {
  const bars = (unzoned: number, inactive: number) =>
    toZoneBars([
      zone(1, 5, 0),
      zone(5, inactive, 0, false),
      zone(null, unzoned, 0),
    ]).map((bar) => bar.label);

  expect(bars(0, 0)).toEqual(["Wilayah 1"]);
  expect(bars(0, 2)).toEqual(["Wilayah 1", "Wilayah 5 (nonaktif)"]);
  expect(bars(3, 0)).toEqual(["Wilayah 1", "Tanpa wilayah"]);
});
