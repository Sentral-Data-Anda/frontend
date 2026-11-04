/**
 * Tiruan `GET /dashboard/umum` (Beranda jemaat): satu jawaban untuk kartu
 * default, termasuk bagi role yang tidak memegang menu staf. Data diambil dari
 * handler yang sudah ada supaya bentuk barisnya tidak bercabang.
 */
import { addDays, todayJakarta } from "../../../src/lib/date";
import { DDL_JEMAAT, listBirthdays } from "../../mock-dashboard";
import { json, type MockContext, type MockHandler } from "../kit";

import { eventMock } from "./event";
import { ibadahMock } from "./ibadah";
import { peminjamanRuangMock } from "./peminjaman-ruang";

const dayOf = (value: string) => value.slice(0, 10);

const call = async (
  handler: MockHandler,
  path: string,
  query: string,
): Promise<unknown[]> => {
  const url = new URL(`http://mock.local${path}?${query}`);
  const context: MockContext = {
    request: new Request(url),
    url,
    path,
    method: "GET",
    can: () => true,
    isAdmin: true,
    sessionCode: "MOCK",
  };
  const response = await handler(context);

  if (!response?.ok) return [];

  const body = (await response.json()) as { data?: unknown[] };

  return body.data ?? [];
};

const dateOf = (value: unknown, fallback: string) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : fallback;

export const dashboardUmumMock: MockHandler = async ({ path, url }) => {
  if (path !== "/dashboard/umum") return null;

  const today = todayJakarta();
  const from = dateOf(url.searchParams.get("startDate"), today);
  const to = dateOf(url.searchParams.get("endDate"), addDays(from, 13));

  const [ibadah, events, loans] = await Promise.all([
    call(ibadahMock, "/ibadah", `startDate=${from}&endDate=${to}&limit=100`),
    call(
      eventMock,
      "/event",
      `startDate=${from}&endDate=${to}&isPublish=1&limit=100`,
    ),
    call(
      peminjamanRuangMock,
      "/loan-room",
      `startDate=${from}&endDate=${to}&limit=100`,
    ),
  ]);

  const days = [from];
  for (let day = addDays(from, 1); day <= to; day = addDays(day, 1)) {
    days.push(day);
  }

  const months = [...new Set(days.map((day) => Number(day.slice(5, 7))))];
  const birthdays = months
    .flatMap((month) => listBirthdays(month))
    .map((row) => ({
      ...row,
      dayKey: dayOf(row.birthDate).slice(5, 10),
    }))
    .filter((row) => days.some((day) => day.slice(5) === row.dayKey))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Ringkasan Beranda",
    data: {
      range: { from, to },
      jemaat: { total: DDL_JEMAAT.length, member: DDL_JEMAAT.length },
      ibadah,
      events,
      loans,
      birthdays,
    },
  });
};
