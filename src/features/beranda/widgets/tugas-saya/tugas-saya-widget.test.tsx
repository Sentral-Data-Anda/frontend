import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { MENU } from "@/config/menu";
import { SessionProvider } from "@/features/auth";
import type { MenuNode } from "@/types/menu";

import { tugasSayaKey, type TugasSayaItem } from "../../api";
import { toDateKey } from "../../model";

import { TugasSayaWidget } from "./tugas-saya-widget";

afterEach(cleanup);

const node = (slug: string, action: MenuNode["action"]): MenuNode => ({
  publicId: slug,
  slug,
  name: slug,
  order: 1,
  action,
  children: [],
});

const JADWAL_VIEW = [
  {
    ...node(MENU.PELAYANAN, []),
    children: [node(MENU.JADWAL_PELAYAN, ["VIEW"])],
  },
];

const task = (index: number): TugasSayaItem => ({
  date: "2026-10-04T00:00:00.000Z",
  startTime: "07:30",
  endTime: "10:00",
  jadwal: { code: `JDL-${index}`, name: `Jadwal ${index}` },
  bapel: { name: "Majelis Jemaat" },
  role: { name: `Tugas ${index}` },
  musikSkill: null,
  group: null,
  ibadah: [],
});

const renderWidget = (items: TugasSayaItem[], menu: MenuNode[] = []) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(tugasSayaKey(toDateKey(new Date())), { data: items });

  return render(
    <QueryClientProvider client={client}>
      <SessionProvider
        session={{
          code: "U1",
          username: "u1",
          status: "ACTIVE",
          roleUser: { name: "Peran", isAdmin: false },
          jemaat: { name: "Andreas" },
          menu,
        }}
      >
        <TugasSayaWidget />
      </SessionProvider>
    </QueryClientProvider>,
  );
};

test("kosong: satu baris penjelasan, kartu tetap tampil", () => {
  renderWidget([]);

  expect(screen.getByText("Tugas saya")).toBeDefined();
  expect(
    screen.getByText("Tidak ada tugas pelayanan dalam 4 pekan ke depan"),
  ).toBeDefined();
});

test("maks 6 baris, sisanya diringkas", () => {
  renderWidget(Array.from({ length: 8 }, (_, i) => task(i + 1)));

  expect(screen.getAllByRole("listitem")).toHaveLength(6);
  expect(screen.getByText("dan 2 tugas lainnya")).toBeDefined();
});

test("tanpa VIEW Jadwal Pelayan: baris dan aksi kartu bukan tautan", () => {
  renderWidget([task(1)]);

  expect(screen.queryAllByRole("link")).toHaveLength(0);
});

test("dengan VIEW Jadwal Pelayan: baris ke halaman baca, aksi ke daftar", () => {
  renderWidget([task(1)], JADWAL_VIEW);

  expect(
    screen.getByRole("link", { name: "Tugas 1" }).getAttribute("href"),
  ).toBe("/pelayanan/jadwal-pelayan/JDL-1");
  expect(
    screen
      .getByRole("link", { name: "Buka jadwal pelayan" })
      .getAttribute("href"),
  ).toBe("/pelayanan/jadwal-pelayan");
});
