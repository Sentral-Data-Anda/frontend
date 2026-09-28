import { describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "../../../src/lib/date";
import { JADWAL_PELAYAN, NEXT_SUNDAY } from "../pelayanan-store";

import { jadwalSayaMock, tasksOf } from "./jadwal-saya";

const onCall = (path: string, method = "GET") => {
  const url = new URL(path, "http://mock.test");

  return jadwalSayaMock({
    request: new Request(url, { method }),
    url,
    path: url.pathname,
    method,
    can: () => false,
    isAdmin: false,
    sessionCode: "test",
  });
};

describe("GET /jadwal-pelayan/saya", () => {
  test("sekretariat (Andreas): Liturgis Minggu depan, jadwal lalu tidak ikut", () => {
    expect(tasksOf("Andreas Sitanggang")).toMatchObject([
      {
        date: `${NEXT_SUNDAY}T00:00:00.000Z`,
        startTime: "07:30",
        jadwal: { name: "Pelayan Ibadah Minggu I" },
        bapel: { name: "Majelis Jemaat" },
        role: { name: "Liturgis" },
        musikSkill: null,
        group: null,
      },
    ]);
  });

  test("koordinator (Christian): perorangan lewat pelayan lain dan lewat kelompok", () => {
    expect(tasksOf("Christian Wijaya")).toMatchObject([
      {
        startTime: "09:00",
        role: { name: "Pemusik" },
        musikSkill: { name: "Gitar" },
        group: null,
      },
      {
        startTime: "17:00",
        role: { name: "Pemusik" },
        musikSkill: null,
        group: { name: "Band Pemuda" },
      },
    ]);
  });

  test("jemaat tanpa tugas atau tidak dikenal: []", () => {
    expect(tasksOf("Debora Manurung")).toEqual([]);
    expect(tasksOf("Admin Sistem")).toEqual([]);
  });

  test("rentang: hari ini s.d. +28 hari", () => {
    const datesFrom = (today: string) =>
      tasksOf("Andreas Sitanggang", today).map((row) => row.date.slice(0, 10));

    expect(JADWAL_PELAYAN[0].date < todayJakarta()).toBe(true);
    expect(datesFrom(addDays(NEXT_SUNDAY, 1))).toEqual([]);
    expect(datesFrom(addDays(NEXT_SUNDAY, -28))).toContain(NEXT_SUNDAY);
    expect(datesFrom(addDays(NEXT_SUNDAY, -29))).not.toContain(NEXT_SUNDAY);
  });

  test("tanpa guard menu; path lain milik handler lain", async () => {
    const response = (await onCall("/jadwal-pelayan/saya")) as Response;

    expect(response.status).toBe(200);
    expect(await onCall("/jadwal-pelayan/JDL_0001-2026-0001")).toBeNull();
    expect(await onCall("/jadwal-pelayan/saya", "POST")).toBeNull();
  });
});
