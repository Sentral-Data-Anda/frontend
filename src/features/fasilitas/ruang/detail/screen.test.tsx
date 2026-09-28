import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import type { MenuSlug } from "@/config/menu";
import type { MenuAction } from "@/types/menu";

import { loanEditHref, ruangEditHref } from "../model";
import type { RoomDetail, RoomUsage } from "../types";

const grants: { current: Partial<Record<MenuSlug, MenuAction[]>> } = {
  current: {},
};

mock.module("next/navigation", () => ({
  useRouter: () => ({ replace: () => {} }),
  usePathname: () => "/fasilitas/ruang/RM-0001",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/features/auth/use-menu-access", () => ({
  useMenuAccess: (slug: MenuSlug) => {
    const actions = grants.current[slug] ?? [];

    return {
      isCanView: actions.includes("VIEW"),
      isCanCreate: actions.includes("CREATE"),
      isCanUpdate: actions.includes("UPDATE"),
      isCanDelete: actions.includes("DELETE"),
    };
  },
}));

const { RuangDetailScreen } = await import("./screen");

const originalFetch = globalThis.fetch;
const CODE = "RM-0001";

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

const ROOM: RoomDetail = {
  id: 1,
  publicId: "r1",
  code: CODE,
  name: "Gedung Gereja",
  capacity: 400,
  isActive: true,
  mainImage: {
    publicId: "m1",
    name: "Tampak depan",
    mimeType: "image/jpeg",
    size: 1,
    showOnWebsite: false,
    url: "http://media/m1.jpeg",
  },
  detailImage: [],
};

const USAGE: RoomUsage[] = [
  {
    kind: "IBADAH",
    code: "IBD-1",
    name: "Ibadah Minggu",
    date: "2026-10-04",
    startTime: "07:00",
    endTime: "09:00",
  },
  {
    kind: "LOAN",
    code: "LR_0001_0000-2026-0001",
    name: "Pemberkatan nikah",
    date: "2026-10-04",
    startTime: "10:00",
    endTime: "13:00",
  },
  {
    kind: "EVENT",
    code: "EVT-1",
    name: "Bazar Natal",
    date: "2026-10-05",
    startTime: "09:00",
    endTime: "15:00",
  },
];

const onRender = (
  granted: Partial<Record<MenuSlug, MenuAction[]>>,
  options: { room?: RoomDetail | null; usage?: RoomUsage[] | 500 } = {},
) => {
  grants.current = granted;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const usage = options.usage ?? USAGE;

    if (url.endsWith("/usage")) {
      if (usage === 500) {
        return Response.json(
          { status: 500, error: "Kesalahan server." },
          { status: 500 },
        );
      }

      return usage.length
        ? Response.json({ status: 200, data: usage })
        : Response.json(
            { status: 404, error: "Pemakaian Ruang Tidak Ditemukan" },
            { status: 404 },
          );
    }
    if (options.room === null) {
      return Response.json(
        { status: 404, error: "Ruang Tidak Ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({ status: 200, data: options.room ?? ROOM });
  }) as unknown as typeof fetch;

  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RuangDetailScreen code={CODE} />
    </QueryClientProvider>,
  );
};

describe("halaman ruang", () => {
  test("tanpa VIEW: keadaan tanpa akses", () => {
    onRender({});

    expect(screen.getByText("Anda tidak memiliki akses ke Ruang")).toBeTruthy();
  });

  test("pemakaian dikelompokkan per tanggal; tautan peminjaman hanya dengan izin", async () => {
    onRender({ RUANG: ["VIEW"] });

    const first = await screen.findByRole("region", {
      name: "Minggu, 4 Okt 2026",
    });
    expect(within(first).getByText("07.00–09.00")).toBeTruthy();
    expect(within(first).getByText("Ibadah")).toBeTruthy();
    expect(within(first).getByText("Peminjaman")).toBeTruthy();
    expect(
      within(
        screen.getByRole("region", { name: "Senin, 5 Okt 2026" }),
      ).getByText("Bazar Natal"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Pemberkatan nikah" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Ubah" })).toBeNull();
    expect(screen.getByText("400 orang · RM-0001")).toBeTruthy();

    cleanup();
    onRender({
      RUANG: ["VIEW", "UPDATE"],
      PEMINJAMAN_RUANG: ["VIEW", "UPDATE"],
    });

    expect(
      (
        await screen.findByRole("link", { name: "Pemberkatan nikah" })
      ).getAttribute("href"),
    ).toBe(loanEditHref("LR_0001_0000-2026-0001"));
    expect(screen.queryByRole("link", { name: "Bazar Natal" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Ubah" }).getAttribute("href"),
    ).toBe(ruangEditHref(CODE));
  });

  test("ruang nonaktif tanpa foto dan tanpa pemakaian", async () => {
    onRender(
      { RUANG: ["VIEW"] },
      {
        room: { ...ROOM, isActive: false, mainImage: null },
        usage: [],
      },
    );

    expect(await screen.findByText("— tidak bisa dipinjam.")).toBeTruthy();
    expect(screen.getByText("Belum ada foto ruang")).toBeTruthy();
    expect(
      await screen.findByText("Belum ada pemakaian 30 hari ke depan"),
    ).toBeTruthy();
  });

  test("pemakaian gagal: satu baris + Coba lagi", async () => {
    onRender({ RUANG: ["VIEW"] }, { usage: 500 });

    expect(
      await screen.findByText("Pemakaian ruang gagal dimuat."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
  });

  test("404: data ruang tidak ditemukan", async () => {
    onRender({ RUANG: ["VIEW"] }, { room: null });

    expect(await screen.findByText("Data ruang tidak ditemukan")).toBeTruthy();
  });
});
