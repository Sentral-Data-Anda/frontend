import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import { SessionProvider, type Session } from "@/features/auth";

import type { LoanRoomItem } from "../../api";
import { addDaysKey, toDateKey, weekKeys } from "../../model";

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

const SESSION: Session = {
  code: "U1",
  username: "u1",
  status: "ACTIVE",
  roleUser: { name: "Sekretariat", isAdmin: false },
  jemaat: { name: "Maria" },
  menu: [
    {
      publicId: "loan",
      slug: MENU.PEMINJAMAN_RUANG,
      name: "Peminjaman Ruangan",
      order: 1,
      action: ["VIEW"],
      children: [],
    },
  ],
};

const renderWith = (items: LoanRoomItem[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  const days = weekKeys(new Date());
  client.setQueryData(["dashboard", "umum", days[0], days[6]], {
    data: { loans: items },
  });

  return render(
    <QueryClientProvider client={client}>
      <SessionProvider session={SESSION}>
        <KpiTodayLoans />
        <LoanRoomsWidget />
      </SessionProvider>
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

  expect(screen.getByText("Peminjaman Ruangan")).toBeDefined();
  expect(screen.getByText("Rapat pengurus · Sari Lubis")).toBeDefined();
  expect(screen.getByText(/18\.00$/)).toBeDefined();
});

test("kosong", () => {
  renderWith([]);

  expect(
    screen.getByText("Tidak ada peminjaman ruang 7 hari ke depan"),
  ).toBeDefined();
});
