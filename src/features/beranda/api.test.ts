import { expect, test } from "bun:test";

import { sortByStartTime, tugasSayaKey, type IbadahListItem } from "./api";

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

test("tugas saya: kunci di bawah jadwal-pelayan, hanya bergantung tanggal", () => {
  expect(tugasSayaKey("2026-09-28")).toEqual([
    "jadwal-pelayan",
    "saya",
    "2026-09-28",
  ]);
});
