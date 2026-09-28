import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import type { LoanRoomItem } from "../../api";
import { addDaysKey, toDateKey } from "../../model";

import { KpiTodayLoans } from "./kpi-today-loans";
import { LoanRoomsWidget } from "./loan-rooms-widget";

afterEach(cleanup);

const today = toDateKey(new Date());

const loan = (offset: number, purpose: string): LoanRoomItem => ({
  code: `LR-${purpose}`,
  date: `${addDaysKey(today, offset)}T00:00:00.000Z`,
  startTime: "18:00",
  endTime: "20:00",
  purpose,
  room: { name: "Aula Serbaguna" },
  jemaat: { name: "Sari Lubis" },
});

const renderWith = (items: LoanRoomItem[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  const query = `startDate=${today}&endDate=${addDaysKey(today, 6)}&limit=100`;
  client.setQueryData(["loan-room", "list", query], { data: items });

  return render(
    <QueryClientProvider client={client}>
      <KpiTodayLoans />
      <LoanRoomsWidget />
    </QueryClientProvider>,
  );
};

test("KPI menghitung peminjaman hari ini dari tujuh hari yang dimuat", () => {
  renderWith([loan(0, "Latihan"), loan(0, "Senam"), loan(3, "Rapat")]);

  expect(screen.getByText("Peminjaman hari ini")).toBeDefined();
  expect(screen.getByText("2")).toBeDefined();
  expect(screen.getByText("3 dalam 7 hari")).toBeDefined();
});

test("widget menampilkan semua status, bukan hanya yang menunggu", () => {
  renderWith([loan(1, "Rapat pengurus")]);

  expect(screen.getByText("Peminjaman ruang 7 hari ke depan")).toBeDefined();
  expect(screen.getByText("Rapat pengurus · Sari Lubis")).toBeDefined();
  expect(screen.getByText(/18\.00$/)).toBeDefined();
});

test("kosong", () => {
  renderWith([]);

  expect(
    screen.getByText("Tidak ada peminjaman ruang 7 hari ke depan"),
  ).toBeDefined();
});
