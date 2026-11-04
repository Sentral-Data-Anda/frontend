import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { MENU } from "@/config/menu";
import { SessionProvider, type Session } from "@/features/auth";

import { weekKeys } from "../../model";

const NEW_MEMBERS = [
  {
    id: "n1",
    name: "Keluarga Sitompul",
    note: "Atestasi masuk",
    date: "2026-09-14",
  },
];

// `mock.module` dipanggil ulang untuk membalik SHOW_DUMMY; getter di dalam
// factory-nya menggantung test runner, jadi nilainya harus datar.
const setDummyShown = (isShown: boolean) =>
  mock.module("../../fixtures", () => ({
    SHOW_DUMMY: isShown,
    DUMMY_NEW_MEMBERS: NEW_MEMBERS,
  }));

setDummyShown(true);

const { JemaatWidget } = await import("./jemaat-widget");

afterEach(() => {
  cleanup();
  setDummyShown(true);
});

const days = weekKeys(new Date());

const SESSION: Session = {
  code: "U1",
  username: "u1",
  status: "ACTIVE",
  roleUser: { name: "Sekretariat", isAdmin: false },
  jemaat: { name: "Maria" },
  menu: [
    {
      publicId: "report",
      slug: MENU.REPORT_JEMAAT,
      name: "Laporan Jemaat",
      order: 1,
      action: ["VIEW"],
      children: [],
    },
  ],
};

const renderWidget = (names: string[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });

  const birthdays = names.map((name, index) => ({
    name,
    gender: "P" as const,
    birthDate: `1990-${days[index].slice(5)}T00:00:00.000Z`,
    dayKey: days[index].slice(5),
    umur: 36,
  }));

  client.setQueryData(["dashboard", "umum", days[0], days[6]], {
    data: { birthdays },
  });

  return render(
    <QueryClientProvider client={client}>
      <SessionProvider session={SESSION}>
        <JemaatWidget />
      </SessionProvider>
    </QueryClientProvider>,
  );
};

test("dua tab: ulang tahun tampil dulu, jemaat baru sesudah dipilih", () => {
  renderWidget(["Christian Wijaya"]);

  expect(screen.getByText("Jemaat")).toBeDefined();
  expect(screen.getByText("Christian Wijaya")).toBeDefined();
  expect(screen.queryByText("Keluarga Sitompul")).toBeNull();

  fireEvent.click(screen.getByRole("tab", { name: /Jemaat Baru/ }));

  expect(screen.getByText("Keluarga Sitompul")).toBeDefined();
});

test("production: tanpa tab, hanya ulang tahun", () => {
  setDummyShown(false);
  renderWidget(["Christian Wijaya"]);

  expect(screen.queryAllByRole("tab")).toEqual([]);
  expect(screen.getByText("Christian Wijaya")).toBeDefined();
  expect(screen.queryByText("Keluarga Sitompul")).toBeNull();
});

test("kosong: keterangan ulang tahun, kartu tetap tampil", () => {
  renderWidget([]);

  expect(screen.getByText("Jemaat")).toBeDefined();
  expect(
    screen.getByText("Tidak ada yang berulang tahun minggu ini"),
  ).toBeDefined();
});
