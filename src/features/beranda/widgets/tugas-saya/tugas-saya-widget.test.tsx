import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { tugasSayaKey, type TugasSayaItem } from "../../api";
import { toDateKey } from "../../model";

const access = { isCanView: false };

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: () => ({ ...access }),
}));

const { TugasSayaWidget } = await import("./tugas-saya-widget");

afterEach(() => {
  cleanup();
  access.isCanView = false;
});

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

const renderWidget = (items: TugasSayaItem[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(tugasSayaKey(toDateKey(new Date())), { data: items });

  return render(
    <QueryClientProvider client={client}>
      <TugasSayaWidget />
    </QueryClientProvider>,
  );
};

test("kosong: satu baris penjelasan, kartu tetap tampil", () => {
  renderWidget([]);

  expect(screen.getByText("Tugas saya")).toBeDefined();
  expect(screen.getByText("4 pekan ke depan")).toBeDefined();
  expect(screen.getByText("Tidak ada tugas pelayanan")).toBeDefined();
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
  access.isCanView = true;
  renderWidget([task(1)]);

  expect(
    screen.getByRole("link", { name: "Tugas 1" }).getAttribute("href"),
  ).toBe("/pelayanan/jadwal-pelayan/JDL-1");
  expect(
    screen.getByRole("link", { name: "Semua jadwal" }).getAttribute("href"),
  ).toBe("/pelayanan/jadwal-pelayan");
});
